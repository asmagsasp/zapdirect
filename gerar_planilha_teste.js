const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const dadosTeste = [
  {
    "Telefone": "19999995149",
    "Destinatario": "Abel",
    "Nome_Salao": "Studio Abel Hair & Nails",
    "Nota": "5.0",
    "Comentarios": "58",
    "Enviado": "Não"
  },
  {
    "Telefone": "18988212696",
    "Destinatario": "Nair",
    "Nome_Salao": "Espaço Beleza Nair",
    "Nota": "4.9",
    "Comentarios": "42",
    "Enviado": "Não"
  }
];

// 1. Gerar Excel (.xlsx)
const ws = XLSX.utils.json_to_sheet(dadosTeste);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Saloes_Teste");

const xlsxPath = path.join(__dirname, 'planilha_teste.xlsx');
XLSX.writeFile(wb, xlsxPath);
console.log('Arquivo XLSX criado em:', xlsxPath);

// 2. Gerar CSV (.csv) com BOM para compatibilidade total com Excel do Windows
const csvContent = "\uFEFFTelefone;Destinatario;Nome_Salao;Nota;Comentarios;Enviado\r\n" +
  "19999995149;Abel;Studio Abel Hair & Nails;5.0;58;Não\r\n" +
  "18988212696;Nair;Espaço Beleza Nair;4.9;42;Não\r\n";

const csvPath = path.join(__dirname, 'planilha_teste.csv');
fs.writeFileSync(csvPath, csvContent, 'utf-8');
console.log('Arquivo CSV criado em:', csvPath);
