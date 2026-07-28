mod commands;
mod db;
mod scanner;

use commands::DbState;
use rusqlite::Connection;
use scanner::ScannerShared;
use tauri::State;

pub struct ScannerState(pub ScannerShared);

#[tauri::command]
async fn scanner_start(
    app: tauri::AppHandle,
    state: State<'_, ScannerState>,
) -> Result<scanner::ScannerInfo, String> {
    scanner::start(state.0.clone(), app).await
}

#[tauri::command]
fn scanner_stop(state: State<'_, ScannerState>) {
    scanner::stop(&state.0);
}

#[tauri::command]
fn scanner_info(state: State<'_, ScannerState>) -> scanner::ScannerInfo {
    scanner::info(&state.0)
}

#[tauri::command]
async fn scanner_setup_usb(state: State<'_, ScannerState>) -> Result<String, String> {
    scanner::setup_usb(&state.0).await
}

#[tauri::command]
fn scanner_usb_qr(state: State<'_, ScannerState>) -> String {
    scanner::usb_qr(&state.0)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let conn = Connection::open(db::db_path()).expect("Falha ao abrir banco de dados");
    db::init(&conn).expect("Falha ao inicializar banco de dados");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(DbState(std::sync::Mutex::new(conn)))
        .manage(ScannerState(scanner::new()))
        .invoke_handler(tauri::generate_handler![
            commands::listar_produtos,
            commands::buscar_produtos,
            commands::criar_produto,
            commands::atualizar_produto,
            commands::excluir_produto,
            commands::criar_venda,
            commands::listar_vendas,
            commands::obter_venda,
            commands::cancelar_venda,
            commands::obter_relatorio,
            commands::produtos_mais_vendidos,
            commands::obter_config,
            commands::salvar_config,
            commands::exportar_csv,
            scanner_start,
            scanner_stop,
            scanner_info,
            scanner_setup_usb,
            scanner_usb_qr,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
