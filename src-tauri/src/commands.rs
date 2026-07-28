use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

pub struct DbState(pub Mutex<rusqlite::Connection>);

// ─── Types ────────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Produto {
    pub id: i64,
    pub nome: String,
    pub descricao: Option<String>,
    pub codigo_barras: Option<String>,
    pub codigo_interno: Option<String>,
    pub preco_venda: f64,
    pub preco_custo: Option<f64>,
    pub ativo: bool,
}

#[derive(Debug, Deserialize)]
pub struct NovoProduto {
    pub nome: String,
    pub descricao: Option<String>,
    pub codigo_barras: Option<String>,
    pub codigo_interno: Option<String>,
    pub preco_venda: f64,
    pub preco_custo: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ItemVendaInput {
    pub produto_id: i64,
    pub nome_produto: String,
    pub quantidade: f64,
    pub preco_unitario: f64,
    pub subtotal: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ItemVendaRow {
    pub id: i64,
    pub produto_id: i64,
    pub nome_produto: String,
    pub quantidade: f64,
    pub preco_unitario: f64,
    pub subtotal: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VendaResumo {
    pub id: i64,
    pub total: f64,
    pub forma_pagamento: String,
    pub status: String,
    pub criado_em: String,
    pub qtd_itens: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VendaCompleta {
    pub id: i64,
    pub total: f64,
    pub forma_pagamento: String,
    pub status: String,
    pub criado_em: String,
    pub itens: Vec<ItemVendaRow>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RelatorioStats {
    pub faturamento: f64,
    pub total_vendas: i64,
    pub ticket_medio: f64,
    pub total_itens_vendidos: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProdutoMaisVendido {
    pub nome: String,
    pub quantidade: f64,
    pub receita: f64,
}

// ─── Produtos ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn listar_produtos(db: State<DbState>) -> Result<Vec<Produto>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, nome, descricao, codigo_barras, codigo_interno, preco_venda, preco_custo, ativo
             FROM produtos WHERE ativo = 1 ORDER BY nome",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(Produto {
                id: row.get(0)?,
                nome: row.get(1)?,
                descricao: row.get(2)?,
                codigo_barras: row.get(3)?,
                codigo_interno: row.get(4)?,
                preco_venda: row.get(5)?,
                preco_custo: row.get(6)?,
                ativo: row.get::<_, i64>(7)? == 1,
            })
        })
        .map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn buscar_produtos(db: State<DbState>, query: String) -> Result<Vec<Produto>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let pattern = format!("%{}%", query);
    let mut stmt = conn
        .prepare(
            "SELECT id, nome, descricao, codigo_barras, codigo_interno, preco_venda, preco_custo, ativo
             FROM produtos
             WHERE ativo = 1 AND (
                 nome LIKE ?1
                 OR codigo_barras = ?2
                 OR codigo_interno = ?2
             )
             ORDER BY nome LIMIT 10",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![pattern, query], |row| {
            Ok(Produto {
                id: row.get(0)?,
                nome: row.get(1)?,
                descricao: row.get(2)?,
                codigo_barras: row.get(3)?,
                codigo_interno: row.get(4)?,
                preco_venda: row.get(5)?,
                preco_custo: row.get(6)?,
                ativo: row.get::<_, i64>(7)? == 1,
            })
        })
        .map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn criar_produto(db: State<DbState>, produto: NovoProduto) -> Result<Produto, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO produtos (nome, descricao, codigo_barras, codigo_interno, preco_venda, preco_custo)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            produto.nome,
            produto.descricao,
            produto.codigo_barras,
            produto.codigo_interno,
            produto.preco_venda,
            produto.preco_custo
        ],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    conn.query_row(
        "SELECT id, nome, descricao, codigo_barras, codigo_interno, preco_venda, preco_custo, ativo
         FROM produtos WHERE id = ?1",
        params![id],
        |row| {
            Ok(Produto {
                id: row.get(0)?,
                nome: row.get(1)?,
                descricao: row.get(2)?,
                codigo_barras: row.get(3)?,
                codigo_interno: row.get(4)?,
                preco_venda: row.get(5)?,
                preco_custo: row.get(6)?,
                ativo: row.get::<_, i64>(7)? == 1,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn atualizar_produto(
    db: State<DbState>,
    id: i64,
    produto: NovoProduto,
) -> Result<Produto, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE produtos SET nome=?1, descricao=?2, codigo_barras=?3, codigo_interno=?4,
         preco_venda=?5, preco_custo=?6, atualizado_em=datetime('now','localtime')
         WHERE id=?7",
        params![
            produto.nome,
            produto.descricao,
            produto.codigo_barras,
            produto.codigo_interno,
            produto.preco_venda,
            produto.preco_custo,
            id
        ],
    )
    .map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT id, nome, descricao, codigo_barras, codigo_interno, preco_venda, preco_custo, ativo
         FROM produtos WHERE id = ?1",
        params![id],
        |row| {
            Ok(Produto {
                id: row.get(0)?,
                nome: row.get(1)?,
                descricao: row.get(2)?,
                codigo_barras: row.get(3)?,
                codigo_interno: row.get(4)?,
                preco_venda: row.get(5)?,
                preco_custo: row.get(6)?,
                ativo: row.get::<_, i64>(7)? == 1,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn excluir_produto(db: State<DbState>, id: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE produtos SET ativo=0, atualizado_em=datetime('now','localtime') WHERE id=?1",
        params![id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

// ─── Vendas ───────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn criar_venda(
    db: State<DbState>,
    itens: Vec<ItemVendaInput>,
    forma_pagamento: String,
    total: f64,
) -> Result<i64, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO vendas (total, forma_pagamento) VALUES (?1, ?2)",
        params![total, forma_pagamento],
    )
    .map_err(|e| e.to_string())?;

    let venda_id = conn.last_insert_rowid();

    for item in &itens {
        conn.execute(
            "INSERT INTO itens_venda (venda_id, produto_id, nome_produto, quantidade, preco_unitario, subtotal)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                venda_id,
                item.produto_id,
                item.nome_produto,
                item.quantidade,
                item.preco_unitario,
                item.subtotal
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(venda_id)
}

#[tauri::command]
pub fn listar_vendas(db: State<DbState>, filtro: String) -> Result<Vec<VendaResumo>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let where_clause = match filtro.as_str() {
        "hoje" => "date(v.criado_em) = date('now','localtime')",
        "semana" => "v.criado_em >= datetime('now','localtime','-7 days')",
        "mes" => "v.criado_em >= datetime('now','localtime','-30 days')",
        _ => "1=1",
    };

    let sql = format!(
        "SELECT v.id, v.total, v.forma_pagamento, v.status, v.criado_em,
                COUNT(iv.id) as qtd_itens
         FROM vendas v
         LEFT JOIN itens_venda iv ON iv.venda_id = v.id
         WHERE {}
         GROUP BY v.id
         ORDER BY v.criado_em DESC",
        where_clause
    );

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(VendaResumo {
                id: row.get(0)?,
                total: row.get(1)?,
                forma_pagamento: row.get(2)?,
                status: row.get(3)?,
                criado_em: row.get(4)?,
                qtd_itens: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn obter_venda(db: State<DbState>, id: i64) -> Result<VendaCompleta, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let venda = conn
        .query_row(
            "SELECT id, total, forma_pagamento, status, criado_em FROM vendas WHERE id = ?1",
            params![id],
            |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, f64>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, String>(4)?,
                ))
            },
        )
        .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, produto_id, nome_produto, quantidade, preco_unitario, subtotal
             FROM itens_venda WHERE venda_id = ?1",
        )
        .map_err(|e| e.to_string())?;

    let itens = stmt
        .query_map(params![id], |row| {
            Ok(ItemVendaRow {
                id: row.get(0)?,
                produto_id: row.get(1)?,
                nome_produto: row.get(2)?,
                quantidade: row.get(3)?,
                preco_unitario: row.get(4)?,
                subtotal: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(VendaCompleta {
        id: venda.0,
        total: venda.1,
        forma_pagamento: venda.2,
        status: venda.3,
        criado_em: venda.4,
        itens,
    })
}

#[tauri::command]
pub fn cancelar_venda(db: State<DbState>, id: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE vendas SET status='cancelada' WHERE id=?1",
        params![id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

// ─── Relatórios ───────────────────────────────────────────────────────────────

#[tauri::command]
pub fn obter_relatorio(db: State<DbState>, filtro: String) -> Result<RelatorioStats, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let where_clause = match filtro.as_str() {
        "hoje" => "date(criado_em) = date('now','localtime')",
        "semana" => "criado_em >= datetime('now','localtime','-7 days')",
        "mes" => "criado_em >= datetime('now','localtime','-30 days')",
        _ => "1=1",
    };

    let sql = format!(
        "SELECT
            COALESCE(SUM(total), 0.0),
            COUNT(*),
            COALESCE(AVG(total), 0.0),
            COALESCE((SELECT SUM(quantidade) FROM itens_venda iv
                      JOIN vendas v2 ON v2.id = iv.venda_id
                      WHERE v2.status = 'concluida' AND {}), 0.0)
         FROM vendas WHERE status = 'concluida' AND {}",
        where_clause, where_clause
    );

    conn.query_row(&sql, [], |row| {
        Ok(RelatorioStats {
            faturamento: row.get(0)?,
            total_vendas: row.get(1)?,
            ticket_medio: row.get(2)?,
            total_itens_vendidos: row.get(3)?,
        })
    })
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn produtos_mais_vendidos(
    db: State<DbState>,
    filtro: String,
) -> Result<Vec<ProdutoMaisVendido>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let where_clause = match filtro.as_str() {
        "hoje" => "date(v.criado_em) = date('now','localtime')",
        "semana" => "v.criado_em >= datetime('now','localtime','-7 days')",
        "mes" => "v.criado_em >= datetime('now','localtime','-30 days')",
        _ => "1=1",
    };

    let sql = format!(
        "SELECT iv.nome_produto, SUM(iv.quantidade) as qtd, SUM(iv.subtotal) as receita
         FROM itens_venda iv
         JOIN vendas v ON v.id = iv.venda_id
         WHERE v.status = 'concluida' AND {}
         GROUP BY iv.produto_id
         ORDER BY qtd DESC
         LIMIT 10",
        where_clause
    );

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(ProdutoMaisVendido {
                nome: row.get(0)?,
                quantidade: row.get(1)?,
                receita: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

// ─── Configurações ────────────────────────────────────────────────────────────

#[tauri::command]
pub fn obter_config(db: State<DbState>, chave: String) -> Result<String, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT valor FROM configuracoes WHERE chave = ?1",
        params![chave],
        |row| row.get(0),
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn salvar_config(db: State<DbState>, chave: String, valor: String) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO configuracoes (chave, valor) VALUES (?1, ?2)
         ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor",
        params![chave, valor],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn exportar_csv(db: State<DbState>) -> Result<String, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut csv = String::from("id,nome,codigo_barras,preco_venda,preco_custo,ativo\n");

    let mut stmt = conn
        .prepare("SELECT id, nome, codigo_barras, preco_venda, preco_custo, ativo FROM produtos")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(format!(
                "{},{},{},{},{},{}\n",
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, Option<String>>(2)?.unwrap_or_default(),
                row.get::<_, f64>(3)?,
                row.get::<_, Option<f64>>(4)?.unwrap_or(0.0),
                row.get::<_, i64>(5)?
            ))
        })
        .map_err(|e| e.to_string())?;

    for row in rows {
        csv.push_str(&row.map_err(|e| e.to_string())?);
    }

    Ok(csv)
}
