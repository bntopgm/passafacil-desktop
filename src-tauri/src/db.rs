use rusqlite::{Connection, Result};
use std::path::PathBuf;

pub fn db_path() -> PathBuf {
    let data_dir = dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("PassaFacil");
    std::fs::create_dir_all(&data_dir).ok();
    data_dir.join("passafacil.db")
}

pub fn init(conn: &Connection) -> Result<()> {
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS produtos (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            nome            TEXT    NOT NULL,
            descricao       TEXT,
            codigo_barras   TEXT,
            codigo_interno  TEXT,
            preco_venda     REAL    NOT NULL CHECK(preco_venda >= 0),
            preco_custo     REAL,
            ativo           INTEGER NOT NULL DEFAULT 1,
            criado_em       TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
            atualizado_em   TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
        );

        CREATE INDEX IF NOT EXISTS idx_produtos_nome          ON produtos(nome);
        CREATE INDEX IF NOT EXISTS idx_produtos_codigo_barras ON produtos(codigo_barras);
        CREATE INDEX IF NOT EXISTS idx_produtos_codigo_interno ON produtos(codigo_interno);

        CREATE TABLE IF NOT EXISTS vendas (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            total           REAL    NOT NULL CHECK(total >= 0),
            forma_pagamento TEXT    NOT NULL,
            status          TEXT    NOT NULL DEFAULT 'concluida',
            criado_em       TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
        );

        CREATE INDEX IF NOT EXISTS idx_vendas_criado_em ON vendas(criado_em);
        CREATE INDEX IF NOT EXISTS idx_vendas_status    ON vendas(status);

        CREATE TABLE IF NOT EXISTS itens_venda (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            venda_id        INTEGER NOT NULL REFERENCES vendas(id),
            produto_id      INTEGER NOT NULL REFERENCES produtos(id),
            nome_produto    TEXT    NOT NULL,
            quantidade      REAL    NOT NULL CHECK(quantidade > 0),
            preco_unitario  REAL    NOT NULL CHECK(preco_unitario >= 0),
            subtotal        REAL    NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_itens_venda_id     ON itens_venda(venda_id);
        CREATE INDEX IF NOT EXISTS idx_itens_produto_id   ON itens_venda(produto_id);

        CREATE TABLE IF NOT EXISTS configuracoes (
            chave TEXT PRIMARY KEY,
            valor TEXT NOT NULL
        );

        INSERT OR IGNORE INTO configuracoes VALUES ('nome_empresa', 'Minha Loja');
        INSERT OR IGNORE INTO configuracoes VALUES ('versao_schema', '1');",
    )?;

    Ok(())
}
