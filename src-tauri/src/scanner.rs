use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use qrcode::{QrCode, render::svg};
use axum::{
    extract::{ws::{Message, WebSocket, WebSocketUpgrade}, Query, State},
    http::StatusCode,
    response::{Html, IntoResponse, Response},
    routing::get,
    Router,
};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use tokio::sync::oneshot;
use uuid::Uuid;

// ── Types ─────────────────────────────────────────────────────────────────────

#[derive(Clone, Serialize, Debug)]
pub struct DeviceInfo {
    pub id: String,
    pub name: String,
    pub reads: u64,
    pub last_seen: String,
}

pub struct ScannerInner {
    pub token: String,
    pub ip: String,
    pub port: u16,
    pub devices: HashMap<String, DeviceInfo>,
    pub last_barcode: Option<String>,
    pub total_reads: u64,
    pub running: bool,
    pub shutdown_tx: Option<oneshot::Sender<()>>,
}

pub type ScannerShared = Arc<Mutex<ScannerInner>>;

#[derive(Serialize, Clone)]
pub struct ScannerInfo {
    pub running: bool,
    pub ip: String,
    pub port: u16,
    pub token: String,
    pub url: String,
    pub qr_svg: String,
    pub devices: Vec<DeviceInfo>,
    pub last_barcode: Option<String>,
    pub total_reads: u64,
}

#[derive(Serialize, Clone, Debug)]
pub struct BarcodePayload {
    pub code: String,
    pub format: String,
    pub device: String,
    pub timestamp: String,
}

// ── Internal axum state ───────────────────────────────────────────────────────

#[derive(Clone)]
struct ServerState {
    scanner: ScannerShared,
    app: AppHandle,
    token: String,
}

#[derive(Deserialize)]
struct TokenQuery {
    token: Option<String>,
}

// ── Public API ────────────────────────────────────────────────────────────────

pub fn new() -> ScannerShared {
    Arc::new(Mutex::new(ScannerInner {
        token: String::new(),
        ip: String::new(),
        port: 8765,
        devices: HashMap::new(),
        last_barcode: None,
        total_reads: 0,
        running: false,
        shutdown_tx: None,
    }))
}

pub async fn start(scanner: ScannerShared, app: AppHandle) -> Result<ScannerInfo, String> {
    {
        let s = scanner.lock().unwrap();
        if s.running {
            return Err("Scanner já está em execução".into());
        }
    }

    let port: u16 = 8765;
    let ip = local_ip_address::local_ip()
        .map(|ip| ip.to_string())
        .unwrap_or_else(|_| "127.0.0.1".to_string());

    let raw = Uuid::new_v4().to_string().replace('-', "");
    let token = raw[..10].to_uppercase();
    let _url = format!("http://{}:{}?token={}", ip, port, token);

    let srv = ServerState { scanner: scanner.clone(), app, token: token.clone() };
    let router = Router::new()
        .route("/", get(handle_mobile))
        .route("/ws", get(handle_ws))
        .with_state(srv);

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port))
        .await
        .map_err(|e| format!("Porta {} em uso: {}", port, e))?;

    let (tx, rx) = oneshot::channel::<()>();

    {
        let mut s = scanner.lock().unwrap();
        s.token = token;
        s.ip = ip;
        s.port = port;
        s.running = true;
        s.devices.clear();
        s.last_barcode = None;
        s.total_reads = 0;
        s.shutdown_tx = Some(tx);
    }

    // Abre porta no Firewall do Windows (best-effort, requer elevação)
    let _ = std::process::Command::new("netsh")
        .args([
            "advfirewall", "firewall", "add", "rule",
            "name=Passa Facil Scanner",
            "dir=in", "action=allow", "protocol=TCP",
            "localport=8765",
        ])
        .output();

    tokio::spawn(async move {
        axum::serve(listener, router)
            .with_graceful_shutdown(async { rx.await.ok(); })
            .await
            .ok();
    });

    Ok(get_info(&scanner))
}

pub async fn setup_usb(scanner: &ScannerShared) -> Result<String, String> {
    let s = scanner.lock().unwrap();
    if !s.running {
        return Err("Inicie o servidor primeiro".into());
    }
    let port = s.port;
    drop(s);

    // Tenta adb reverse automaticamente
    let adb_result = std::process::Command::new("adb")
        .args(["reverse", &format!("tcp:{}", port), &format!("tcp:{}", port)])
        .output();

    match adb_result {
        Ok(out) if out.status.success() => Ok("ok".into()),
        Ok(out) => {
            let stderr = String::from_utf8_lossy(&out.stderr).to_string();
            Err(if stderr.is_empty() { "adb falhou".into() } else { stderr })
        }
        Err(_) => Err("adb não encontrado".into()),
    }
}

pub fn usb_qr(scanner: &ScannerShared) -> String {
    let s = scanner.lock().unwrap();
    if !s.running {
        return String::new();
    }
    let url = format!("http://127.0.0.1:{}?token={}", s.port, s.token);
    make_qr_svg(&url)
}

pub fn stop(scanner: &ScannerShared) {
    let mut s = scanner.lock().unwrap();
    if let Some(tx) = s.shutdown_tx.take() {
        let _ = tx.send(());
    }
    s.running = false;
    s.devices.clear();
}

pub fn info(scanner: &ScannerShared) -> ScannerInfo {
    get_info(scanner)
}

fn get_info(scanner: &ScannerShared) -> ScannerInfo {
    let s = scanner.lock().unwrap();
    let url = if s.running {
        format!("http://{}:{}?token={}", s.ip, s.port, s.token)
    } else {
        String::new()
    };
    let qr_svg = if !url.is_empty() { make_qr_svg(&url) } else { String::new() };
    ScannerInfo {
        running: s.running,
        ip: s.ip.clone(),
        port: s.port,
        token: s.token.clone(),
        url,
        qr_svg,
        devices: s.devices.values().cloned().collect(),
        last_barcode: s.last_barcode.clone(),
        total_reads: s.total_reads,
    }
}

fn make_qr_svg(data: &str) -> String {
    QrCode::new(data.as_bytes())
        .map(|code| {
            code.render::<svg::Color>()
                .min_dimensions(220, 220)
                .quiet_zone(true)
                .build()
        })
        .unwrap_or_default()
}

// ── HTTP handlers ─────────────────────────────────────────────────────────────

async fn handle_mobile(_state: State<ServerState>) -> Html<&'static str> {
    Html(MOBILE_HTML)
}

async fn handle_ws(
    ws: WebSocketUpgrade,
    Query(q): Query<TokenQuery>,
    State(state): State<ServerState>,
) -> Response {
    if q.token.unwrap_or_default() != state.token {
        return (StatusCode::UNAUTHORIZED, "Token inválido\n").into_response();
    }
    ws.on_upgrade(move |socket| socket_task(socket, state))
}

async fn socket_task(mut socket: WebSocket, state: ServerState) {
    let device_id = Uuid::new_v4().to_string()[..8].to_string();

    let _ = socket
        .send(Message::Text(r#"{"status":"connected"}"#.to_string()))
        .await;

    while let Some(Ok(msg)) = socket.recv().await {
        let text = match msg {
            Message::Text(t) => t,
            Message::Close(_) => break,
            _ => continue,
        };

        let Ok(payload) = serde_json::from_str::<serde_json::Value>(&text) else {
            continue;
        };

        match payload["type"].as_str().unwrap_or("") {
            "connect" => {
                let name = payload["device"].as_str().unwrap_or("Celular").to_string();
                state.scanner.lock().unwrap().devices.insert(
                    device_id.clone(),
                    DeviceInfo { id: device_id.clone(), name, reads: 0, last_seen: String::new() },
                );
            }
            "barcode" => {
                let code = payload["code"].as_str().unwrap_or("").to_string();
                if code.is_empty() {
                    continue;
                }
                let format = payload["format"].as_str().unwrap_or("UNKNOWN").to_string();
                let device = payload["device"].as_str().unwrap_or("Celular").to_string();
                let ts = payload["timestamp"].as_str().unwrap_or("").to_string();

                {
                    let mut s = state.scanner.lock().unwrap();
                    s.last_barcode = Some(code.clone());
                    s.total_reads += 1;
                    s.devices
                        .entry(device_id.clone())
                        .and_modify(|d| {
                            d.reads += 1;
                            d.last_seen = ts.clone();
                            d.name = device.clone();
                        })
                        .or_insert(DeviceInfo {
                            id: device_id.clone(),
                            name: device.clone(),
                            reads: 1,
                            last_seen: ts.clone(),
                        });
                }

                let _ = state.app.emit("barcode-received", BarcodePayload {
                    code,
                    format,
                    device,
                    timestamp: ts,
                });

                let _ = socket
                    .send(Message::Text(r#"{"status":"ok"}"#.to_string()))
                    .await;
            }
            "ping" => {
                let _ = socket
                    .send(Message::Text(r#"{"status":"pong"}"#.to_string()))
                    .await;
            }
            _ => {}
        }
    }

    state.scanner.lock().unwrap().devices.remove(&device_id);
}

// ── Mobile PWA ────────────────────────────────────────────────────────────────

static MOBILE_HTML: &str = r##"<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
  <meta name="theme-color" content="#0f172a">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>Passa Fácil Scanner</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    :root{--blue:#3B9EFF;--green:#22c55e;--red:#ef4444;--bg:#0f172a;--surface:#1e293b;--border:rgba(255,255,255,0.08);--text:#f1f5f9;--muted:#94a3b8}
    html,body{height:100%;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow:hidden}
    #app{display:flex;flex-direction:column;height:100dvh}
    header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--surface);border-bottom:1px solid var(--border);flex-shrink:0;gap:12px}
    .brand{font-size:15px;font-weight:700;color:var(--blue);white-space:nowrap}
    .status{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:500;white-space:nowrap}
    .dot{width:9px;height:9px;border-radius:50%;background:var(--red);transition:background .3s;flex-shrink:0}
    .dot.on{background:var(--green)}
    #viewfinder{flex:1;position:relative;background:#000;overflow:hidden}
    #video{width:100%;height:100%;object-fit:cover;display:block}
    .overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none}
    .frame{position:relative;width:240px;height:150px}
    .frame::before{content:'';position:absolute;inset:0;border:2px solid rgba(59,158,255,.6);border-radius:12px;box-shadow:0 0 0 9999px rgba(0,0,0,.35)}
    .corner{position:absolute;width:22px;height:22px;border-color:var(--blue);border-style:solid}
    .tl{top:-2px;left:-2px;border-width:3px 0 0 3px;border-radius:8px 0 0 0}
    .tr{top:-2px;right:-2px;border-width:3px 3px 0 0;border-radius:0 8px 0 0}
    .bl{bottom:-2px;left:-2px;border-width:0 0 3px 3px;border-radius:0 0 0 8px}
    .br{bottom:-2px;right:-2px;border-width:0 3px 3px 0;border-radius:0 0 8px 0}
    .flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;transition:opacity .05s}
    .flash.on{opacity:.35}
    #err{display:none;position:absolute;inset:0;align-items:center;justify-content:center;flex-direction:column;gap:12px;padding:24px;text-align:center;background:var(--bg)}
    #err.show{display:flex}
    #err h2{font-size:18px}
    #err p{font-size:14px;color:var(--muted);line-height:1.6}
    footer{padding:16px;background:var(--surface);flex-shrink:0;border-top:1px solid var(--border)}
    .row{display:flex;align-items:center;gap:10px;margin-bottom:12px}
    #last{font-size:20px;font-weight:700;letter-spacing:1.5px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text)}
    #last.empty{font-size:14px;font-weight:400;color:var(--muted);letter-spacing:0}
    .badge{background:rgba(59,158,255,.15);color:var(--blue);border:1px solid rgba(59,158,255,.3);border-radius:20px;padding:5px 14px;font-size:12px;font-weight:700;white-space:nowrap}
    .btn{width:100%;padding:13px;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(255,255,255,.06);color:var(--text);font-size:14px;font-weight:500;cursor:pointer;transition:background .2s;display:flex;align-items:center;justify-content:center;gap:8px}
    .btn:active{background:rgba(255,255,255,.12)}
  </style>
</head>
<body>
<div id="app">
  <header>
    <span class="brand">Passa Fácil Scanner</span>
    <div class="status">
      <div class="dot" id="dot"></div>
      <span id="stxt">Desconectado</span>
    </div>
  </header>

  <div id="viewfinder">
    <video id="video" autoplay playsinline muted></video>
    <div class="overlay">
      <div class="frame">
        <div class="corner tl"></div>
        <div class="corner tr"></div>
        <div class="corner bl"></div>
        <div class="corner br"></div>
      </div>
    </div>
    <div class="flash" id="flash"></div>
    <div id="err">
      <h2>Câmera indisponível</h2>
      <p>Permita acesso à câmera nas configurações do seu navegador e recarregue a página.</p>
    </div>
  </div>

  <footer>
    <div class="row">
      <span class="last empty" id="last">Aguardando leitura...</span>
      <span class="badge" id="cnt">0</span>
    </div>
    <button class="btn" id="swbtn">⟳&nbsp; Trocar câmera</button>
  </footer>
</div>
<script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
<script>
(function(){
  var params = new URLSearchParams(location.search);
  var TOKEN  = params.get('token') || '';
  var WS_URL = 'ws://' + location.hostname + ':' + location.port + '/ws?token=' + TOKEN;
  var UA     = navigator.userAgent;
  var DEVICE = UA.includes('iPhone') ? 'iPhone'
             : UA.includes('iPad')   ? 'iPad'
             : (UA.match(/Android[^;]*;\s*([^)]+)/) || ['','Celular'])[1].trim();

  var ws       = null;
  var count    = 0;
  var lastCode = '';
  var lastTime = 0;
  var scanner  = null;
  var cameras  = [];
  var camIdx   = 0;

  var dotEl   = document.getElementById('dot');
  var stxtEl  = document.getElementById('stxt');
  var lastEl  = document.getElementById('last');
  var cntEl   = document.getElementById('cnt');
  var flashEl = document.getElementById('flash');
  var errEl   = document.getElementById('err');
  var swBtn   = document.getElementById('swbtn');

  // ── WebSocket ────────────────────────────────────────────────────────────
  function connect() {
    try { ws = new WebSocket(WS_URL); } catch(e) { setTimeout(connect, 3000); return; }
    ws.onopen = function() {
      dotEl.className = 'dot on';
      stxtEl.textContent = 'Conectado';
      ws.send(JSON.stringify({ type:'connect', device:DEVICE }));
    };
    ws.onclose = ws.onerror = function() {
      dotEl.className = 'dot';
      stxtEl.textContent = 'Reconectando...';
      setTimeout(connect, 2000);
    };
  }

  function send(code, fmt) {
    var now = Date.now();
    if (code === lastCode && now - lastTime < 1800) return;
    lastCode = code; lastTime = now;
    count++;
    cntEl.textContent = count;
    lastEl.textContent = code;
    lastEl.className = 'last';
    flashEl.className = 'flash on';
    setTimeout(function(){ flashEl.className = 'flash'; }, 80);
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({
        type:'barcode', code:code, format:fmt, device:DEVICE,
        timestamp: new Date().toISOString()
      }));
    }
  }

  // ── Camera ───────────────────────────────────────────────────────────────
  function startScanner(deviceId) {
    if (scanner) {
      scanner.stop().catch(function(){}).finally(function(){ launchScanner(deviceId); });
    } else {
      launchScanner(deviceId);
    }
  }

  function launchScanner(deviceId) {
    errEl.className = '';
    scanner = new Html5Qrcode('viewfinder');
    var config = { fps:12, aspectRatio:1.7 };
    var constraint = deviceId ? { deviceId:{ exact:deviceId } } : { facingMode:'environment' };
    scanner.start(constraint, config,
      function(code, result){
        var fmt = (result && result.result && result.result.format) ? result.result.format.formatName : 'UNKNOWN';
        send(code, fmt);
      },
      function(){}
    ).catch(function(){
      errEl.className = 'show';
    });
  }

  Html5Qrcode.getCameras().then(function(devs){
    cameras = devs;
    startScanner(cameras.length > 0 ? cameras[0].id : null);
  }).catch(function(){
    startScanner(null);
  });

  swBtn.addEventListener('click', function(){
    if (cameras.length > 1) {
      camIdx = (camIdx + 1) % cameras.length;
      startScanner(cameras[camIdx].id);
    } else {
      camIdx = 1 - camIdx;
      if (scanner) {
        scanner.stop().catch(function(){}).finally(function(){
          scanner = new Html5Qrcode('viewfinder');
          scanner.start(
            { facingMode: camIdx === 0 ? 'environment' : 'user' },
            { fps:12 },
            function(code){ send(code, 'UNKNOWN'); },
            function(){}
          ).catch(function(){ errEl.className = 'show'; });
        });
      }
    }
  });

  connect();
})();
</script>
</body>
</html>"##;
