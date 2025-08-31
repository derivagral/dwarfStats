use wasm_bindgen::prelude::*;
use std::io::Cursor;

#[wasm_bindgen]
pub fn to_json(bytes: &[u8]) -> Result<String, JsValue> {
    // Parse .sav
    let mut cur = Cursor::new(bytes);
    let save = uesave::Save::read(&mut cur)
        .map_err(|e| JsValue::from_str(&format!("read error: {e}")))?;
    // Serialize same structure the CLI prints
    serde_json::to_string_pretty(&save)
        .map_err(|e| JsValue::from_str(&format!("serde to_json error: {e}")))
}

#[wasm_bindgen]
pub fn from_json(json: &str) -> Result<Box<[u8]>, JsValue> {
    // Read JSON back into Save
    let save: uesave::Save = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("serde from_json error: {e}")))?;
    // Write .sav bytes
    let mut out = Vec::new();
    save.write(&mut out)
        .map_err(|e| JsValue::from_str(&format!("write error: {e}")))?;
    Ok(out.into_boxed_slice())
}

