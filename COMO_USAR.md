# 🚀 ZapDirect - Guia de Uso Rápido

Sistema inteligente para prospecção e envio de mensagens para salões de beleza no **WhatsApp Web sem precisar cadastrar o número na agenda do celular**.

---

## 💻 Como Executar o Sistema

O sistema já está pronto e rodando localmente no seu computador!

1. Basta abrir o seu navegador (Google Chrome, Edge ou Firefox) e acessar:
   👉 **`http://localhost:3000`**

2. Caso reinicie o computador, você pode rodar pelo terminal na pasta do projeto:
   ```bash
   python -m http.server 3000
   ```
   *Ou dar 2 cliques no arquivo `iniciar.bat` que deixamos pronto para você!*

---

## ⭐ Modelos de Mensagens Disponíveis

### 1. Foco na Dor: Perda de Tempo & Desmarcações (Novo ⭐)
> "Oi, **{destinatario}**! Encontrei o ***{nome_salao}*** no Google e fiquei impressionado com a qualidade do serviço.
>
> Uma dúvida rápida: você perde muito tempo do seu dia respondendo mensagens de agendamento e lidando com clientes que desmarcam em cima da hora?
>
> Pergunto porque criei uma plataforma simples que automatiza tudo isso para as clientes agendarem sozinhas. Se fizer sentido, te mando um demonstrativo sem compromisso."

### 2. Parceria & Destaque Google Recomendado (Gestão & Agenda)
> "Oi, **{destinatario}**, como vai? Estava buscando por esmalterias de destaque na região pelo Google, encontrei o perfil do ***{nome_salao}*** e tomei a liberdade de te chamar. Vi que vocês têm uma excelente avaliação de ***{nota_salao} estrelas*** com ***{qtd_comentarios} comentários***, o que mostra o quanto as clientes amam o serviço de vocês!
>
> Imagino que manter esse padrão e ainda administrar a equipe e os horários exija bastante energia sua todos os dias. Conversando com outras profissionais da área, notei que o controle de agendamentos e o tempo gasto respondendo mensagens são os maiores gargalos para quem quer continuar crescendo.
>
> Eu trabalho com tecnologia e construo plataformas exclusivas para gestão de beleza. Desenvolvi um sistema bem simples que organiza a sua agenda de forma automática e dá uma cara super profissional (à altura das suas avaliações) para o seu negócio na internet. Você estaria aberta a receber um link de demonstração para ver se faria sentido para o seu espaço hoje?"

### 2. Demonstração Rápida de Agendamento Automático (Direto & Objetivo)
> "Olá, **{destinatario}**! **{saudacao}**!
>
> Estava analisando os espaços de beleza de destaque no Google da nossa região e encontrei o perfil do ***{nome_salao}***.
>
> Parabéns pela excelente avaliação de ***{nota_salao} estrelas*** e os ***{qtd_comentarios} comentários positivos***! Isso reflete a qualidade incrível do trabalho de vocês.
>
> Sei que cuidar dos atendimentos e ao mesmo tempo administrar agendamentos no WhatsApp toma muito tempo do dia. Criei uma plataforma prática que automatiza a agenda das suas clientes 24h por dia e envia lembretes automáticos para evitar faltas.
>
> Você teria 1 minutinho para eu te enviar um link de demonstração para ver como ficaria personalizado com o nome do ***{nome_salao}***?"

---

## 🏷️ Tags Dinâmicas Disponíveis

Você pode usar essas tags em qualquer modelo que criar ou editar no botão **"Mensagem Padrão"**:

| Tag | O que substitui | Exemplo |
|---|---|---|
| `{destinatario}` | Nome da Dona ou Nome do Salão | *Juliana* ou *Studio Saah Esmalteria & Cursos* |
| `{nome_salao}` | Nome do Salão de Beleza | *Espaço Bella Mulher* |
| `{nome_dona}` | Nome da Dona / Responsável | *Patrícia* |
| `{nota_salao}` | Nota de avaliação no Google | *4.9* |
| `{qtd_comentarios}` | Quantidade de avaliações | *85 avaliações* |
| `{saudacao}` | Saudação automática pelo horário | *Bom dia*, *Boa tarde* ou *Boa noite* |
| `{personalizado}` | Observação ou elogio específico digitado no envio | *vi o trabalho incrível de unhas decoradas no seu Insta* |

---

## ✍️ Personalização da Mensagem no Envio Individual (1 a 1)

Agora você tem **total controle e liberdade** sobre a mensagem antes de enviá-la:

1. **Editor de Texto Direto no Formulário**:
   - A mensagem gerada pelo modelo selecionado aparece em uma caixa de texto editável diretamente no formulário.
   - Você pode **reescrever qualquer frase, adicionar detalhes específicos do salão ou apagar trechos**.
   - O indicador de status mostra se a mensagem está no **Modo Automático** ou se é uma **Mensagem Personalizada**.
2. **Botão "Restaurar Modelo"**:
   - Se você fez alterações e quiser voltar ao texto original do modelo preenchido com os dados do salão, basta clicar em **"Restaurar Modelo"**.
3. **Barra de Tags & Emojis Rápidos**:
   - Clique em qualquer tag (`{destinatario}`, `{nome_salao}`, `{personalizado}`, etc.) ou emoji (💅, ⭐, ✨, 📅, 💬, 🚀) para inserir na posição exata do cursor.
4. **Campo "Observação / Elogio Personalizado"**:
   - Campo opcional para anotar um elogio ou observação única sobre o salão (ex: *"adorei a decoração do seu espaço"*, *"vi suas unhas no Instagram"*), que é automaticamente inserido na tag `{personalizado}`.

---

## 📊 Novo: Disparo por Planilha (Excel / CSV) com Proteção Anti-Ban

Agora você pode carregar uma lista inteira de salões de uma vez e disparar de forma automática e segura!

### Como usar o envio em lote:
1. No topo da página, clique na aba **"Disparo por Planilha"**.
2. **Importe seu arquivo**: arraste seu arquivo `.xlsx`, `.xls` ou `.csv` para a área de upload (ou clique em *"Baixar Planilha Exemplo"* para ver o formato ideal).
3. **Mapeamento Automático**: o sistema detecta sozinho as colunas de telefone, destinatário, nome do salão, nota e comentários.
4. **Configuração Anti-Ban**:
   - **Intervalo Seguro**: escolha entre **1 minuto (60s)**, **1,5 minuto (90s)** ou **2 minutos (120s - Altamente Recomendado)**.
   - **Variação Humana Aleatória**: ativa por padrão, adiciona variações de ±15s para que o WhatsApp não detecte padrão robótico.
5. **Selecione o Modelo**: escolha qual das suas mensagens salvas será disparada para a lista.
6. **Inicie os Disparos**: clique em **"Iniciar Disparos"**.
   - O sistema abrirá a conversa de cada salão no WhatsApp Web no intervalo programado.
   - Um bip sonoro suave avisa quando a conversa do próximo salão é aberta na tela.
   - Você pode pausar, pular contatos ou baixar um **Relatório (Excel/CSV)** com o status de cada envio!

