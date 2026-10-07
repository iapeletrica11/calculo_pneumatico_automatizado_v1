/*
 * ARQUITETURA MVC DA APLICAÇÃO
 * Model: estado, catálogos e funções de domínio/cálculo (calc, calcSopro e totais).
 * View: montagem e atualização de tabelas, formulários, indicadores e relatórios.
 * Controller: eventos de login, navegação, edição, projetos e exportação.
 * Persistência: PneumoStorage é a única porta de acesso ao armazenamento local.
 * Integração futura: substitua o adaptador por uma implementação de repositório/API;
 * ao usar banco remoto, converta as operações para async/await antes da troca.
 * O HTML continua autocontido para manter a forma atual de abrir e usar o projeto.
 */
/* MODEL — nomes das chaves e utilitários puros compartilhados pela aplicação. */
const CHAVE='consumo_pneumatico_v4',PROJECTS_KEY='consumo_pneumatico_projetos_v1',CATALOGS_KEY='consumo_pneumatico_catalogos_v1', $=id=>document.getElementById(id), clone=x=>JSON.parse(JSON.stringify(x));
/* PERSISTÊNCIA — contrato substituível com operações getItem, setItem e removeItem. */
const PneumoStorage=window.PneumoStorage;
/* MODEL — conversões numéricas e formatação sem dependência da interface. */
const num=x=>{const n=parseFloat(String(x??'').replace(',','.'));return Number.isFinite(n)?n:0},fmt=(x,d=2)=>num(x).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}),agora=()=>new Date().toLocaleString('pt-BR');
const cilindrosBase=[['CILINDRO LIMITADOR TUBETE',20,50,'1/8'],['EMPURADOR TECIDO',50,700,'1/4'],['APLICADOR DE FITA',32,320,'1/8'],['CORTADOR DE FITAS',20,40,'1/8'],['EXPULSA ROLO DO APLICADOR DE FITAS',63,160,'3/8'],['PEGADOR DE TUBETE VERTICAL',32,500,'1/8'],['PEGADOR DE TUBETE HORIZONTAL',20,120,'1/8'],['PEGADOR DE TUBETE LATERAL',20,50,'1/8'],['JOGO DE TECIDO',32,80,'1/8'],['JOGO DE TUBETE AO BOBINADOR',32,80,'1/8'],['BATENTE DA BALANÇA',50,50,'1/4'],['TOMBADOR DA BALANÇA',50,200,'1/4']].map(([nome,diam,curso,rosca],i)=>({id:'c'+(i+1),nome,diam,curso,rosca,acao:'Dupla ação',erp:'',erpdesc:'',obs:''})).concat([
 {id:'c13',nome:'CP96SDB63-100C',diam:63,curso:100,acao:'Dupla ação',tipoHaste:'Simples',diamHaste:20,rosca:'3/8',erp:'2.000001054',erpdesc:'CIL PNEUM. ISO15552 Ø63 C100 D.ACAO C/MAG',obs:''},
 {id:'c14',nome:'CP96SDB63-125C',diam:63,curso:125,acao:'Dupla ação',tipoHaste:'Simples',diamHaste:20,rosca:'3/8',erp:'2.000000173',erpdesc:'CIL PNEUM. ISO15552 Ø63 C125 D.ACAO C/MAG',obs:''},
 {id:'c15',nome:'CP96SDB32-100C',diam:32,curso:100,acao:'Dupla ação',tipoHaste:'Simples',diamHaste:12,rosca:'1/8',erp:'2.000004870',erpdesc:'CIL PNEUM. ISO15552 Ø32 C100 D.ACAO C/MAG',obs:''},
 {id:'c16',nome:'CP96SDB50-900C*BR',diam:50,curso:900,acao:'Dupla ação',tipoHaste:'Simples',diamHaste:20,rosca:'1/4',erp:'2.000004300',erpdesc:'CIL PNEUM. ISO15552 Ø50 C900 D.ACAO C/MAG',obs:''},
 {id:'c17',nome:'CD85N25-75C-B',diam:25,curso:75,acao:'Dupla ação',tipoHaste:'Simples',diamHaste:10,rosca:'1/8',erp:'2.000000773',erpdesc:'CIL PNEUM. ISO6432 Ø25 C75 D.ACAO C/MAG',obs:''},
 {id:'c18',nome:'CP96SDB63-250C',diam:63,curso:250,acao:'Dupla ação',tipoHaste:'Simples',diamHaste:20,rosca:'3/8',erp:'2.000000161',erpdesc:'CIL PNEUM. ISO15552 Ø63 C250 D.ACAO C/MAG',obs:''},
 {id:'c19',nome:'CP96SDB63-160C',diam:63,curso:160,acao:'Dupla ação',tipoHaste:'Simples',diamHaste:20,rosca:'3/8',erp:'2.000000163',erpdesc:'CIL PNEUM. ISO15552 Ø63 C160 D.ACAO C/MAG',obs:''},
 {id:'c20',nome:'CP96SDB32-160C',diam:32,curso:160,acao:'Dupla ação',tipoHaste:'Simples',diamHaste:12,rosca:'1/8',erp:'2.000000032',erpdesc:'CIL PNEUM. ISO15552 Ø32 C160 D.ACAO C/MAG',obs:''},
 {id:'c21',nome:'CP96SDB40-1300C',diam:40,curso:1300,acao:'Dupla ação',tipoHaste:'Simples',diamHaste:16,rosca:'1/4',erp:'2.000005091',erpdesc:'CIL PNEUM. ISO15552 Ø40 C1300 D.ACAO C/MAG',obs:''},
 {id:'c22',nome:'CP96SDB50-50C',diam:50,curso:50,acao:'Dupla ação',tipoHaste:'Simples',diamHaste:20,rosca:'1/4',erp:'2.000000306',erpdesc:'CIL PNEUM. ISO15552 Ø50 C50 D.ACAO C/MAG',obs:''},
 {id:'c23',nome:'CP96SDB50-0200',diam:50,curso:200,acao:'Dupla ação',tipoHaste:'Simples',diamHaste:20,rosca:'1/4',erp:'2.000000307',erpdesc:'CIL PNEUM. ISO15552 Ø50 C200 D.ACAO C/MAG',obs:''},
 {id:'c24',nome:'CP96SDB63-400C',diam:63,curso:400,acao:'Dupla ação',tipoHaste:'Simples',diamHaste:20,rosca:'3/8',erp:'2.000002701',erpdesc:'CIL PNEUM. ISO15552 Ø63 C400 D.ACAO C/MAG',obs:''},
 {id:'c25',nome:'CP96SB32-125',diam:32,curso:125,acao:'Dupla ação',tipoHaste:'Simples',diamHaste:12,rosca:'1/8',erp:'2.000000495',erpdesc:'CIL PNEUM. ISO15552 Ø32 C125 D.ACAO C/MAG',obs:''},
 {id:'c26',nome:'CP96SDB40-300C',diam:40,curso:300,acao:'Dupla ação',tipoHaste:'Simples',diamHaste:16,rosca:'1/4',erp:'2.000003341',erpdesc:'CIL PNEUM. ISO15552 Ø40 C300 D.ACAO C/MAG',obs:''}
]);
const valvulasBase=[{id:'v1',modelo:'SY7120-5DZ-02',vias:'5/2',acionamento:'Solenóide',tensao:'24 VCC',vazao:854,rosca:'1/4',erp:'2.000000241',erpdesc:'VALV. SOLE. 5/2VIAS 1/4" 24VCC SY7120-5DZ-02',obs:''},{id:'v2',modelo:'SY7320-5DZ-02B',vias:'5/3',acionamento:'Solenóide',tensao:'24 VCC',vazao:1000,rosca:'1/4',erp:'2.000000242',erpdesc:'VALV. SOLENO. 5/3VIAS 1/4" CF 24VCC SY7320-5DZ-02B',obs:''},{id:'v3',modelo:'SY7420-5DZ-02',vias:'5/3',acionamento:'Solenóide',tensao:'24VCC',vazao:912,rosca:'1/4',erp:'2.000000927',erpdesc:'VALV. SOLENO. 5/3VIAS 1/4" CAN 24VCC SY7420-5DZ-02',obs:'CENTRO ABERTO NEGATIVO'}];
const mangueirasBase=[['MANGUEIRA 6',47.35,5],['MANGUEIRA 8',84.74,10],['MANGUEIRA 10',167.61,20]].map(([nome,vazao,dmax],i)=>({id:'h'+(i+1),nome,vazao,dmax,erp:'',erpdesc:nome}));
const sopradoresBase=[
 {id:'s-base-kn-r02-200',tipo:'Bico soprador',nome:'BICO DE AR',modelo:'KN-R02-200',erp:'2.000001333',erpdesc:'CONEXAO BICO DE AR FIXO Ø2 MODELO KN-R02-200',nfuros:1,dfuro:2,pressaoMax:10,vazao:'',obs:''},
 {id:'s-base-haste-sopro',tipo:'Haste com furos',nome:'HASTE SOPRO',modelo:'FABRICADO',erp:'4.000038291',erpdesc:'HASTE SOPRO INFERIOR IMPRESSORA HORIZONTAL',nfuros:3,dfuro:2,pressaoMax:10,vazao:'',obs:''},
 {id:'s-base-zh15dsa-02-03-03',tipo:'Gerador de vácuo',nome:'GERADORA DE VACUO',modelo:'ZH15DSA-02-03-03',erp:'2.000001421',erpdesc:'VALVULA GERADORA DE VACUO ZH15DSA-02-03-03 SMC',nfuros:1,dfuro:1.5,pressaoMax:10,vazao:'',obs:''}
];
const filtrosBase=[
 {id:'f-base-2000000608',tipo:'Separador de condensado',nome:'AMG350C-F04BD',erp:'2.000000608',erpdesc:'FILTRO AR SEPARADOR CONDENSADO 1/2" AMG350C-F04BD',rosca:'ROSCA +ENCAIXE: AMG + AW + ISE10',largura:59,altura:207,profund:59,vazao:1500,pressaoMax:10,faixaReg:'',filtragem:5,dreno:'Automático',obs:''},
 {id:'f-base-2000000605',tipo:'Filtro regulador',nome:'AW40-F04BDE-B',erp:'2.000000605',erpdesc:'FILTRO REGULADOR C/ DRENO AUTO. 1/2" AW40-F04BDE-B',rosca:'ENCAIXE: AMG + AW + ISE10',largura:91,altura:149,profund:70,vazao:1500,pressaoMax:10,faixaReg:'0,5-8,5',filtragem:5,dreno:'Automático',obs:''},
 {id:'f-base-2000000602',tipo:'Pressostato',nome:'IS10E-40F04-6L-A',erp:'2.000000602',erpdesc:'PRESSOSTATO PNEUMA 1NA/NF 1-6BAR 1/2" IS10E-4004-6',rosca:'ENCAIXE: AMG + AW + ISE10 + ROSCA',largura:37,altura:82,profund:32,vazao:1500,pressaoMax:10,faixaReg:'1-10',filtragem:'',dreno:'Não se aplica',obs:''},
 {id:'f-base-2000000606',tipo:'Separador de condensado',nome:'AMG150C-F02BD',erp:'2.000000606',erpdesc:'FILTRO AR SEPARADOR CONDENSADO 1/4" AMG150C-F02BD',rosca:'ROSCA 1/4 +ENCAIXE MODULAR',largura:63,altura:99,profund:63,vazao:1000,pressaoMax:10,faixaReg:'',filtragem:'0,3',dreno:'Automático',obs:''},
 {id:'f-base-2000000603',tipo:'Filtro regulador',nome:'AW20-F02BDE-B',erp:'2.000000603',erpdesc:'FILTRO REGULADOR C/ DRENO AUTO. 1/4" AW20-F02BDE-B',rosca:'ENCAIXE MODULAR',largura:54,altura:136,profund:45,vazao:750,pressaoMax:10,faixaReg:'0,05-8,85',filtragem:5,dreno:'Automático',obs:'MANOMET'},
 {id:'f-base-2000000246',tipo:'Pressostato',nome:'IS10E-2002-6',erp:'2.000000246',erpdesc:'PRESSOSTATO PNEUM 1NA/NF 1-6BAR 1/4" IS10E-2002-6',rosca:'ENCAIXE MODULAR + ROSCA 1/4',largura:18,altura:50,profund:18,vazao:'',pressaoMax:10,faixaReg:'1-6',filtragem:'',dreno:'Não se aplica',obs:'CABO 2m'}
];
let estado={pv:'',desenho:'',cliente:'',projetista:'',codPai:'',data:'',linhas:[],sopros:[],bicos:[],sopradores:clone(sopradoresBase),filtros:clone(filtrosBase),filtroSel:null,cilindros:clone(cilindrosBase),valvulas:clone(valvulasBase),mangueiras:clone(mangueirasBase),params:{pressao:6,taxa:1,margem:1.1},paineis:[],painelAtivoId:''},projetoAtualId='',assinaturaSalva='',copiaSemAlteracao=false;
$('loginBtn').onclick=async()=>{const b=$('loginBtn');b.disabled=true;$('loginErr').textContent='Conectando ao banco compartilhado...';try{await PneumoStorage.login($('loginUser').value.trim(),$('loginPass').value);$('loginGate').hidden=true;$('loginPass').value='';$('loginErr').textContent=''}catch(e){$('loginErr').textContent=e.message||'Não foi possível entrar. Confira o e-mail e a senha.'}finally{b.disabled=false}};$('loginPass').onkeydown=e=>{if(e.key==='Enter')$('loginBtn').click()};
function novoPainel(nome='Painel 1'){return {id:'pan'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),nome,linhas:[],sopros:[],params:{pressao:6,taxa:1,margem:1.1},filtroSel:filtroSelPadrao()}}
const linhasSelecionadas=new Set();let clipboardPainel=null,menuLinhasAtual=null;
function dadosPainel(){return {linhas:clone(estado.linhas||[]),sopros:clone(estado.sopros||[]),params:clone(estado.params||{pressao:6,taxa:1,margem:1.1}),filtroSel:clone(estado.filtroSel||filtroSelPadrao())}}
function gravarPainelAtivo(){if(!Array.isArray(estado.paineis))estado.paineis=[];let p=estado.paineis.find(x=>x.id===estado.painelAtivoId);if(!p){p=novoPainel('Painel 1');estado.paineis.push(p);estado.painelAtivoId=p.id}Object.assign(p,dadosPainel())}
function normalizarPaineis(x){if(!Array.isArray(x.paineis)||!x.paineis.length){const p=novoPainel('Painel 1');Object.assign(p,{linhas:clone(x.linhas||[]),sopros:clone(x.sopros||[]),params:clone(x.params||{pressao:6,taxa:1,margem:1.1}),filtroSel:clone(x.filtroSel||filtroSelPadrao())});x.paineis=[p];x.painelAtivoId=p.id}else{x.paineis=x.paineis.map((p,i)=>({...novoPainel('Painel '+(i+1)),...p,params:p.params||{pressao:6,taxa:1,margem:1.1},filtroSel:p.filtroSel||filtroSelPadrao()}));if(!x.paineis.some(p=>p.id===x.painelAtivoId))x.painelAtivoId=x.paineis[0].id;const a=x.paineis.find(p=>p.id===x.painelAtivoId);Object.assign(x,{linhas:clone(a.linhas||[]),sopros:clone(a.sopros||[]),params:clone(a.params),filtroSel:clone(a.filtroSel)})}return x}
function trocarPainel(id){linhasSelecionadas.clear();gravarPainelAtivo();const p=estado.paineis.find(x=>x.id===id);if(!p)return;estado.painelAtivoId=p.id;Object.assign(estado,{linhas:clone(p.linhas),sopros:clone(p.sopros),params:clone(p.params),filtroSel:clone(p.filtroSel)});[['p_pressao','pressao'],['p_taxa','taxa'],['p_margem','margem']].forEach(([i,k])=>$(i).value=estado.params[k]);salvar();renderAll();renderPainelSelect()}
function renderPainelSelect(){const s=$('painelSelect');if(!s)return;s.innerHTML='';(estado.paineis||[]).forEach(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=p.nome;s.append(o)});s.value=estado.painelAtivoId}
function totalGeralPV(){gravarPainelAtivo();let total=0;for(const p of estado.paineis){const old={linhas:estado.linhas,sopros:estado.sopros,params:estado.params,filtroSel:estado.filtroSel};Object.assign(estado,{linhas:p.linhas,sopros:p.sopros,params:p.params,filtroSel:p.filtroSel});total+=totaisProjeto().geral;Object.assign(estado,old)}return total}function resumoPaineis(){gravarPainelAtivo();const out=[];for(const p of estado.paineis){const old={linhas:estado.linhas,sopros:estado.sopros,params:estado.params,filtroSel:estado.filtroSel};Object.assign(estado,{linhas:p.linhas,sopros:p.sopros,params:p.params,filtroSel:p.filtroSel});out.push('Painel '+p.nome+': '+fmt(totaisProjeto().geral)+' L/min');Object.assign(estado,old)}out.push('TOTAL GERAL DA PV: '+fmt(totalGeralPV())+' L/min');return out}function catalogosEstado(x=estado){return {cilindros:x.cilindros,valvulas:x.valvulas,mangueiras:x.mangueiras,bicos:x.bicos,sopradores:x.sopradores,filtros:x.filtros}}
function signature(x=estado){const y=clone(x);['data','salvoEm','finalizado','id','cilindros','valvulas','mangueiras','bicos','sopradores','filtros'].forEach(k=>delete y[k]);return JSON.stringify(y)}
function salvar(){gravarPainelAtivo();estado.data=agora();$('data').value=estado.data;try{PneumoStorage.setItem(CHAVE,JSON.stringify(estado))}catch(e){console.error('Não foi possível persistir o projeto no navegador.',e)}try{PneumoStorage.setItem(CATALOGS_KEY,JSON.stringify(catalogosEstado()))}catch(e){console.error('Não foi possível persistir os catálogos no navegador.',e)}if(copiaSemAlteracao&&signature()!==assinaturaSalva){if(String(estado.pv||'').endsWith(' (CÓPIA)'))estado.pv=estado.pv.slice(0,-8);$('pv').value=estado.pv;copiaSemAlteracao=false}}
function carregar(){let legado=null,catalogos=null;try{legado=JSON.parse(PneumoStorage.getItem(CHAVE)||'null')}catch(e){console.error('Não foi possível ler os dados anteriores do navegador.',e)}if(legado)estado={...estado,...legado};try{catalogos=JSON.parse(PneumoStorage.getItem(CATALOGS_KEY)||'null')}catch(e){console.error('Não foi possível ler os catálogos salvos no navegador.',e)}const padroes={cilindros:cilindrosBase,valvulas:valvulasBase,mangueiras:mangueirasBase,bicos:[],sopradores:[],filtros:[]};Object.keys(padroes).forEach(k=>{estado[k]=Array.isArray(catalogos?.[k])?catalogos[k]:Array.isArray(estado[k])?estado[k]:clone(padroes[k])});estado.cilindros.forEach(c=>{c.tipoHaste=c.tipoHaste??'Simples';c.diamHaste=c.diamHaste??''});estado.params=estado.params||{pressao:6,taxa:1,margem:1.1};normalizarPaineis(estado);estado.mangueiras.forEach((m,i)=>{m.id=m.id||'h'+(i+1);m.erp=m.erp??'';m.erpdesc=m.erpdesc??m.nome});estado.bicos=estado.bicos.filter(b=>b.tipo!=='Outra peça divergente');estado.filtroSel=estado.filtroSel||filtroSelPadrao();estado.sopros=estado.sopros||[];estado.linhas=(estado.linhas||[]).map(l=>({...l,descFuncao:l.descFuncao??'',qtdVal:l.qtdVal??1,obs:l.obs??'',uid:l.uid||novoUid(),sopro:!!l.sopro}));estado.paineis.forEach(p=>{p.linhas=(p.linhas||[]).map(l=>({...l,descFuncao:l.descFuncao??'',qtdVal:l.qtdVal??1,obs:l.obs??'',uid:l.uid||novoUid(),sopro:!!l.sopro}));p.sopros=p.sopros||[]});try{PneumoStorage.setItem(CHAVE,JSON.stringify(estado));PneumoStorage.setItem(CATALOGS_KEY,JSON.stringify(catalogosEstado()))}catch(e){console.error('Não foi possível inicializar os catálogos no navegador.',e)}}
/* MODEL — cálculo pneumático dos conjuntos a partir do estado e dos catálogos. */
function calc(l){
 const c=estado.cilindros.find(x=>x.id===l.cil),v=estado.valvulas.find(x=>x.id===l.val);if(!c)return null;
 const P=num(estado.params.pressao),Patm=num(estado.params.taxa)||1,marg=num(estado.params.margem),D=num(c.diam),C=num(c.curso),dh=num(c.diamHaste),ac=num(l.acion),q=num(l.qtd),dist=num(l.dist);
 const area=Math.PI*(D/10)**2/4,areaHaste=Math.PI*(dh/10)**2/4,areaRecuo=Math.max(0,area-areaHaste),dupla=String(c.tipoHaste||'Simples').toLowerCase()==='dupla',areaAvanco=dupla?areaRecuo:area,volAvanco=areaAvanco*(C/10),volRecuo=areaRecuo*(C/10),fc=(P+Patm)/Patm,ciclo=(volAvanco+volRecuo)*fc,cons=ciclo*ac*q*marg/1000,forcaAvanco=areaAvanco*P*1.0197,forcaRecuo=areaRecuo*P*1.0197;
 const orden=[...estado.mangueiras].sort((a,b)=>num(a.vazao)-num(b.vazao)),sug=orden.find(x=>num(x.dmax)>=dist),man=estado.mangueiras.find(x=>x.id===l.mang)||sug;
 return {c,v,P,Patm,marg,D,C,dh,area,areaHaste,areaAvanco,areaRecuo,volAvanco,volRecuo,fc,ciclo,cons,forcaAvanco,forcaRecuo,ac,q,dist,man};
}/* VIEW — renderização dos campos de catálogo e interação visual das tabelas. */
function fields(idh,idb,arr,cols){$(idh).innerHTML='<tr>'+cols.map(x=>'<th>'+x[1]+'</th>').join('')+'<th></th></tr>';const tb=$(idb);tb.innerHTML='';arr.forEach((o,i)=>{const tr=document.createElement('tr');cols.forEach(([k,title,options],ci)=>{const td=document.createElement('td');let x;if(options){x=document.createElement('select');options.forEach(value=>{const z=document.createElement('option');z.value=value;z.textContent=value;x.append(z)});x.value=o[k]||options[0];x.onchange=()=>{o[k]=x.value;salvar();renderProject()}}else{x=document.createElement('input');if(k==='areaInterna'){o.areaInterna=areaFuros(1,o.diamInterno);x.value=o.areaInterna?o.areaInterna.toFixed(2):'';x.readOnly=true;x.title='Calculada: π × diâmetro interno² ÷ 4'}else{x.value=o[k]??'';if(k==='diamInterno'){x.type='text';x.disabled=false;x.readOnly=false;x.inputMode='decimal';x.autocomplete='off';x.placeholder='Ex.: 6,0';x.className='campo-diametro-interno';x.setAttribute('aria-label','Diâmetro interno da mangueira em milímetros');x.title='Campo editável: informe o diâmetro interno em milímetros'}}x.oninput=()=>{o[k]=x.value;if(k==='diamInterno'){const diam=num(x.value);o.areaInterna=diam>0?areaFuros(1,diam):0;const areaInput=tr.cells[ci+1]?.querySelector('input');if(areaInput)areaInput.value=o.areaInterna?o.areaInterna.toFixed(2):''}salvar();renderProject()}}td.append(x);tr.append(td)});const td=document.createElement('td'),b=document.createElement('button');b.textContent='×';b.className='del';b.onclick=()=>{arr.splice(i,1);salvar();renderAll()};td.append(b);tr.append(td);tb.append(tr)})}const fcil=[['nome','Nome/descrição'],['diam','Diâmetro (mm)'],['curso','Curso (mm)'],['acao','Tipo de ação'],['tipoHaste','Tipo de haste',['Simples','Dupla']],['diamHaste','Diâmetro da haste (mm)'],['rosca','Rosca'],['erp','Código ERP'],['erpdesc','Descrição ERP'],['obs','Características / observações']],fval=[['modelo','Modelo'],['vias','Vias'],['acionamento','Acionamento'],['tensao','Tensão'],['vazao','Vazão l/min'],['rosca','Rosca'],['erp','Código ERP'],['erpdesc','Descrição ERP'],['obs','Características / observações']],ff=[['nome','Função'],['desc','Descrição da função'],['cil','Cilindro padrão'],['val','Válvula padrão']],fm=[['nome','Mangueira'],['diamInterno','Diâmetro interno (mm)'],['areaInterna','Área interna (mm²)'],['vazao','Vazão máxima (L/min)'],['dmax','Distância máx. m'],['erp','Código ERP'],['erpdesc','Descrição ERP']];
function text(x){const e=document.createElement('span');e.textContent=x;return e}
function linhasSelecionadasAtuais(){return estado.linhas.filter(l=>linhasSelecionadas.has(l.uid))}
function fecharMenuLinhas(e){if(e&&menuLinhasAtual?.contains(e.target))return;if(menuLinhasAtual){menuLinhasAtual.remove();menuLinhasAtual=null}}
function atualizarClipboardUI(){const b=$('pasteLinhas');if(b)b.disabled=!clipboardPainel?.linhas?.length}
function copiarLinhasSelecionadas(){const linhas=linhasSelecionadasAtuais();if(!linhas.length){alert('Selecione ao menos uma linha.');return}const ids=new Set(linhas.map(l=>l.uid));clipboardPainel={linhas:clone(linhas),sopros:clone(estado.sopros.filter(s=>ids.has(s.linha)))};atualizarClipboardUI()}
function colarLinhasCopiadas(){if(!clipboardPainel?.linhas?.length){alert('Ainda não há linhas copiadas.');return}const mapa=new Map();clipboardPainel.linhas.forEach(l=>mapa.set(l.uid,novoUid()));clipboardPainel.linhas.forEach(l=>estado.linhas.push({...clone(l),uid:mapa.get(l.uid)}));clipboardPainel.sopros.forEach(s=>estado.sopros.push({...clone(s),id:'sp'+Date.now()+Math.random().toString(36).slice(2,6),linha:mapa.get(s.linha)}));linhasSelecionadas.clear();salvar();renderProject()}
function moverLinhasPara(id){const destino=estado.paineis.find(p=>p.id===id),linhas=linhasSelecionadasAtuais();if(!linhas.length){alert('Marque as linhas que deseja mover.');return}if(!destino||destino.id===estado.painelAtivoId)return;const nomes=linhas.map(l=>l.tag||l.descFuncao||'Conjunto').join(', ');if(!confirm('Mover '+linhas.length+' linha(s) para '+destino.nome+'?\n\n'+nomes))return;const ids=new Set(linhas.map(l=>l.uid)),sopros=estado.sopros.filter(s=>ids.has(s.linha));estado.linhas=estado.linhas.filter(l=>!ids.has(l.uid));estado.sopros=estado.sopros.filter(s=>!ids.has(s.linha));gravarPainelAtivo();destino.linhas=destino.linhas||[];destino.sopros=destino.sopros||[];destino.linhas.push(...clone(linhas));destino.sopros.push(...clone(sopros));linhasSelecionadas.clear();salvar();renderProject()}
function moverParaProximoPainel(){const i=estado.paineis.findIndex(p=>p.id===estado.painelAtivoId),dest=estado.paineis[i+1];if(!dest){alert('Não há outro painel cadastrado depois do painel ativo.');return}moverLinhasPara(dest.id)}
function escolherPainelDestino(){const opcoes=estado.paineis.filter(p=>p.id!==estado.painelAtivoId);if(!opcoes.length){alert('Cadastre outro painel antes de mover linhas.');return}const texto=opcoes.map((p,i)=>(i+1)+'. '+p.nome).join('\n'),resposta=prompt('Digite o número do painel de destino:\n'+texto);if(resposta===null)return;const destino=opcoes[Number(resposta)-1];if(!destino){alert('Escolha inválida.');return}moverLinhasPara(destino.id)}
function abrirMenuLinhas(x,y){fecharMenuLinhas();const menu=document.createElement('div');menu.className='menu-linhas';menu.setAttribute('role','menu');const acoes=[['Copiar linhas selecionadas',copiarLinhasSelecionadas],['Colar linhas copiadas',colarLinhasCopiadas],['Mover para o próximo painel',moverParaProximoPainel],['Mover para escolher painel…',escolherPainelDestino]];acoes.forEach(([rotulo,acao])=>{const b=document.createElement('button');b.type='button';b.textContent=rotulo;b.disabled=rotulo.startsWith('Colar')&&!clipboardPainel;b.onclick=()=>{fecharMenuLinhas();acao()};menu.append(b)});document.body.append(menu);menu.style.left=Math.min(x,window.innerWidth-menu.offsetWidth-8)+'px';menu.style.top=Math.min(y,window.innerHeight-menu.offsetHeight-8)+'px';menuLinhasAtual=menu;setTimeout(()=>document.addEventListener('pointerdown',fecharMenuLinhas,{once:true}),0)}
/* VIEW — atualiza valores calculados e indicadores exibidos na tela. */
function updateCells(){let total=0;[...$('corpoProj').rows].forEach((tr,i)=>{const r=calc(estado.linhas[i]);if(!r)return;const c=tr.querySelectorAll('td');c[3].textContent='Ø'+r.D+' x '+r.C+' mm';c[12].textContent=r.man?r.man.nome:'-';c[13].textContent=r.man?fmt(r.man.vazao):'-';c[14].textContent=fmt(r.cons);c[15].textContent=fmt(r.forcaAvanco);c[16].textContent=fmt(r.forcaRecuo);total+=r.cons});$('total').textContent=fmt(total);$('totalPV').textContent=fmt(totalGeralPV());marcarFaltas();atualizarSopros()}
/* VIEW — desenha a tabela principal de conjuntos do projeto. */
function renderProject(){
 $('cabProj').innerHTML='<tr>'+['Sopro','Cilindro ERP / descrição','Descrição da função','Dimensões','Válvula / modelo','Qtd. válvulas','TAG','Qtd. cilindros','Acion./min','Tempo (s)','Dist. (m)','Mangueira manual','Mangueira usada','Vazão l/min','Consumo l/min','Força avanço kgf','Força recuo kgf','Observações do conjunto'].map(x=>'<th>'+x+'</th>').join('')+'<th>Selecionar</th><th></th></tr>';
 const tb=$('corpoProj');tb.innerHTML='';tb.oncontextmenu=e=>{if(e.target===tb){e.preventDefault();abrirMenuLinhas(e.clientX,e.clientY)}};estado.linhas.forEach((l,i)=>{const tr=document.createElement('tr'),r=calc(l);function cell(el){const td=document.createElement('td');td.append(el);tr.append(td)}function input(k){const x=document.createElement('input');x.value=l[k]??'';x.oninput=()=>{l[k]=x.value;salvar();updateCells()};return x}function select(k,list,label,empty){const x=document.createElement('select');x.innerHTML='<option value="">'+empty+'</option>';list.forEach(o=>{const z=document.createElement('option');z.value=o.id;z.textContent=label(o);x.append(z)});x.value=l[k]||'';x.onchange=()=>{l[k]=x.value;salvar();renderProject()};return x}function nota(){const x=document.createElement('textarea');x.placeholder='Ex.: válvula pilotada; retorno por mola';x.value=l.obs||'';x.oninput=()=>{l.obs=x.value;salvar()};return x}
 cell(botaoSopro(l));cell(select('cil',estado.cilindros,c=>[c.erp,c.erpdesc,c.nome].filter(Boolean).join(' | '),'Selecione cilindro'));cell(input('descFuncao'));cell(text(r?'Ø'+r.D+' x '+r.C+' mm':'-'));cell(select('val',estado.valvulas,v=>v.modelo+' ('+v.vias+')','Selecione válvula'));cell(input('qtdVal'));['tag','qtd','acion','tempo','dist'].forEach(k=>cell(input(k)));cell(select('mang',estado.mangueiras,m=>m.nome,'Automática'));cell(text(r?.man?.nome||'-'));cell(text(r?fmt(r.man?.vazao):'-'));cell(text(r?fmt(r.cons):'-'));cell(text(r?fmt(r.forcaAvanco):'-'));cell(text(r?fmt(r.forcaRecuo):'-'));cell(nota());const selTd=document.createElement('td'),sel=document.createElement('input');sel.type='checkbox';sel.className='linha-select';sel.setAttribute('aria-label','Selecionar conjunto '+(i+1));sel.checked=linhasSelecionadas.has(l.uid);sel.onchange=()=>sel.checked?linhasSelecionadas.add(l.uid):linhasSelecionadas.delete(l.uid);selTd.append(sel);tr.append(selTd);tr.dataset.uid=l.uid;tr.oncontextmenu=e=>{e.preventDefault();if(!linhasSelecionadas.has(l.uid)){linhasSelecionadas.clear();linhasSelecionadas.add(l.uid);tb.querySelectorAll('.linha-select').forEach(x=>x.checked=x.closest('tr').dataset.uid===l.uid)}abrirMenuLinhas(e.clientX,e.clientY)};const td=document.createElement('td'),b=document.createElement('button');b.textContent='×';b.className='del';b.onclick=()=>{estado.sopros=estado.sopros.filter(s=>s.linha!==l.uid);estado.linhas.splice(i,1);linhasSelecionadas.delete(l.uid);salvar();renderProject()};td.append(b);tr.append(td);tb.append(tr)});updateCells();renderSopros()
}function renderAll(){fields('cabCil','corpoCil',estado.cilindros,fcil);fields('cabVal','corpoVal',estado.valvulas,fval);fields('cabMang','corpoMang',estado.mangueiras,fm);renderCatBico();renderCatSop();renderCatFiltros();renderProject()}
function migrarProjetosSalvos(){const projetos=allProjects();let alterado=false;projetos.forEach(p=>{if(!Array.isArray(p.paineis)||!p.paineis.length){normalizarPaineis(p);alterado=true}});if(alterado){try{PneumoStorage.setItem(PROJECTS_KEY,JSON.stringify(projetos))}catch(e){console.error('Nao foi possivel migrar os projetos salvos.',e)}}}function allProjects(){try{return JSON.parse(PneumoStorage.getItem(PROJECTS_KEY)||'[]')}catch(e){return []}}function refreshProjects(id=''){$('savedProjects').innerHTML='<option value="">Selecione um projeto salvo</option>';allProjects().forEach(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=(p.pv||'Sem PV')+' — '+(p.cliente||'Sem cliente')+(p.finalizado?' [FINALIZADO]':'');$('savedProjects').append(o)});$('savedProjects').value=id}function snapshot(){return clone(estado)}
/* CONTROLLER — coordena salvar, finalizar e copiar projetos. */
function saveProject(finalizado=false,copia=false,silencioso=false){const arr=allProjects(),id=copia?'':projetoAtualId,changed=!assinaturaSalva||signature()!==assinaturaSalva;if(!changed&&!finalizado&&!copia){if(!silencioso)alert('Não há alterações para salvar.');return false}const d=snapshot();['cilindros','valvulas','mangueiras','bicos','sopradores','filtros'].forEach(k=>delete d[k]);d.finalizado=finalizado;d.salvoEm=new Date().toISOString();const key=id||'prj'+Date.now(),i=arr.findIndex(x=>x.id===key),obj={...d,id:key};if(i<0)arr.push(obj);else arr[i]=obj;try{PneumoStorage.setItem(PROJECTS_KEY,JSON.stringify(arr))}catch(e){if(!silencioso)alert('Não foi possível salvar no navegador.');return false}projetoAtualId=key;PneumoStorage.setItem('consumo_pneumatico_projeto_atual',key);assinaturaSalva=signature();copiaSemAlteracao=copia;refreshProjects(silencioso?($('savedProjects').value||key):key);if(!silencioso)alert('Projeto salvo na lista.');return true} /* silencioso = salvamento automático: sem alerta e sem trocar o projeto selecionado na lista */
function loadProject(){const p=allProjects().find(x=>x.id===$('savedProjects').value);if(!p){alert('Selecione um projeto salvo.');return}estado={...estado,...p,...catalogosEstado(),codPai:p.codPai||'',sopros:p.sopros||[],filtroSel:p.filtroSel||filtroSelPadrao()};normalizarPaineis(estado);estado.linhas=(estado.linhas||[]).map(l=>({...l,qtdVal:l.qtdVal??1,obs:l.obs??'',uid:l.uid||novoUid(),sopro:!!l.sopro}));projetoAtualId=p.id;assinaturaSalva=signature();copiaSemAlteracao=String(estado.pv||'').endsWith(' (CÓPIA)');['pv','desenho','cliente','projetista','codPai'].forEach(k=>$(k).value=estado[k]||'');$('p_pressao').value=estado.params.pressao;$('p_taxa').value=estado.params.taxa;$('p_margem').value=estado.params.margem;renderPainelSelect();renderAll()}
function criarNovo(){if(assinaturaSalva&&signature()!==assinaturaSalva&&!confirm('Você vai perder os itens cadastrados neste projeto se não salvar antes. Deseja criar um novo projeto?'))return;estado={...estado,pv:'',desenho:'',cliente:'',projetista:'',codPai:'',data:'',linhas:[],sopros:[],filtroSel:filtroSelPadrao(),params:{pressao:6,taxa:1,margem:1.1},paineis:[],painelAtivoId:''};normalizarPaineis(estado);projetoAtualId='';assinaturaSalva=signature();copiaSemAlteracao=false;['pv','desenho','cliente','projetista','codPai'].forEach(k=>$(k).value='');$('savedProjects').value='';$('p_pressao').value=6;$('p_taxa').value=1;$('p_margem').value=1.1;renderPainelSelect();salvar();renderAll()}
function gerarPdf(){
 const {jsPDF}=window.jspdf,doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
 doc.setFontSize(15);doc.text('RESUMO DE CONSUMO PNEUMÁTICO',14,15);doc.setFontSize(9);
 doc.text('PV: '+(estado.pv||'-')+' | Desenho: '+(estado.desenho||'-')+' | Cliente: '+(estado.cliente||'-')+' | Projetista: '+(estado.projetista||'-'),14,23);
 const body=estado.linhas.map(l=>{
  const r=calc(l);
  if(!r){ // linha sem cilindro: só entra se for linha de soprador (mostra função, válvula e TAG)
   if(!l.sopro)return null;
   return [l.descFuncao||'','SOPRO','-',estado.valvulas.find(x=>x.id===l.val)?.modelo||'',num(l.qtdVal),l.obs||'',l.tag||'','-','-','-','-','-','-','-','-'];
  }
  return [l.descFuncao||'','Ø'+r.D+' x '+r.C+' mm',l.qtd,r.v?.modelo||'',num(l.qtdVal),l.obs||'',l.tag||'',l.acion,l.tempo,l.dist,r.man?.nome||'-',r.man?fmt(r.man.vazao):'-',fmt(r.cons),fmt(r.forcaAvanco),fmt(r.forcaRecuo)];
 }).filter(Boolean);
 doc.autoTable({startY:28,styles:{fontSize:7},head:[['Descrição da função','Cilindro','Qtd. cilindros','Modelo da válvula','Qtd. válvulas','Observações','TAG','Acion/min','Tempo','Distância','Mangueira','Vazão','Consumo l/min','Força avanço kgf','Força recuo kgf']],body});
 let y=doc.lastAutoTable.finalY+8;
 const t=totaisProjeto(); // consumo das válvulas/cilindros, dos sopradores e total
 if(estado.sopros.length){ // tabela dos sopradores (só aparece quando o projeto tem sopradores)
  if(y>165){doc.addPage();y=15}
  doc.setFontSize(11);doc.text('SOPRADORES',14,y);
  doc.autoTable({startY:y+3,styles:{fontSize:7},head:[['Soprador (identificação)','Bico utilizado','Qtd. de furos','Ø dos furos (mm)','Pressão (bar)','Tempo de acionamento (s/min)','Vazão estimada (l/min)','Consumo médio por soprador (l/min)','Qtd. de sopradores','Consumo total dos sopradores (l/min)']],
   body:estado.sopros.map(s=>{const r=calcSopro(s);return [s.nome||(r.sop?rotSop(r.sop):'-'),r.bico?rotBico(r.bico):'-',fmtL(r.nf),fmtL(r.d),fmtL(r.P),fmtL(r.t),fmt(r.vazao)+(r.informada?' (informada)':''),fmt(r.porSopro),fmtL(r.q),fmt(r.total)]})});
  y=doc.lastAutoTable.finalY+8;
 }
 const fsel=filtrosSelecionados().filter(x=>x.usar); // filtros de ar que o projeto precisa
 if(fsel.length){ // tabela dos filtros (só aparece se alguma pergunta foi respondida com "Sim")
  if(y>165){doc.addPage();y=15}
  doc.setFontSize(11);doc.text('FILTROS DE AR',14,y);
  doc.autoTable({startY:y+3,styles:{fontSize:7},head:[['Tipo','Escolha','Código ERP','Descrição','Encaixe','Capacidade (l/min)','Consumo do projeto (l/min)','Situação']],
   body:fsel.map(x=>[x.nomeTipo,x.modo,x.f?.erp||'-',x.f?(x.f.erpdesc||x.f.nome||'-'):'-',x.f?.rosca||'-',x.f&&num(x.f.vazao)>0?fmt(x.f.vazao):'-',fmt(x.demanda),x.status])});
  y=doc.lastAutoTable.finalY+8;
 }
 if(y>185){doc.addPage();y=15}
 doc.setFontSize(11);
 if(estado.sopros.length){ // três totais bem separados
  doc.text('CONSUMO TOTAL - VÁLVULAS/CILINDROS: '+fmt(t.cil)+' l/min',14,y);
  doc.text('CONSUMO TOTAL - SOPRADORES: '+fmt(t.sop)+' l/min',14,y+6);
  doc.setFont('helvetica','bold');doc.text('CONSUMO TOTAL DO PROJETO: '+fmt(t.geral)+' l/min',14,y+13);doc.setFont('helvetica','normal');
 }else doc.text('Consumo total: '+fmt(t.cil)+' l/min',14,y); // sem sopradores: igual ao que era
 gravarPainelAtivo();for(const p of estado.paineis){const old={linhas:estado.linhas,sopros:estado.sopros,params:estado.params,filtroSel:estado.filtroSel};Object.assign(estado,{linhas:p.linhas||[],sopros:p.sopros||[],params:p.params||{pressao:6,taxa:1,margem:1.1},filtroSel:p.filtroSel||filtroSelPadrao()});const tp=totaisProjeto();doc.addPage();doc.setFontSize(13);doc.text('PAINEL: '+p.nome,14,15);doc.setFontSize(10);doc.text('Total do painel: '+fmt(tp.geral)+' l/min',14,22);doc.autoTable({startY:27,styles:{fontSize:8},head:[['TAG','Descrição da função','Consumo (l/min)']],body:[...(p.linhas||[]).map(l=>[l.tag||'-',l.descFuncao||'-',calc(l)?fmt(calc(l).cons):'-']),...(p.sopros||[]).map((sp,i)=>{const r=calcSopro(sp);return [sp.nome||('Soprador '+(i+1)), 'Soprador',fmt(r.total)]})]});Object.assign(estado,old)}doc.addPage();doc.setFontSize(13);doc.text('TOTAL GERAL DA PV: '+fmt(totalGeralPV())+' l/min',14,15); const name='consumo_pneumatico'+(estado.pv?'_PV'+estado.pv.replace(/[\\/:*?"<>|]/g,'_'):'')+'.pdf';return {blob:doc.output('blob'),nome:name}}
function gerarPdfOrganizado(todosPainels=false){
 gravarPainelAtivo();const selecionados=todosPainels?estado.paineis:[estado.paineis.find(p=>p.id===estado.painelAtivoId)].filter(Boolean);if(!selecionados.length)return null;
 const {jsPDF}=window.jspdf,doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'}),resumos=[];
 const metadados='PV: '+(estado.pv||'-')+' | Desenho: '+(estado.desenho||'-')+' | Cliente: '+(estado.cliente||'-');
 selecionados.forEach((p,pi)=>{if(pi)doc.addPage();const antigo={linhas:estado.linhas,sopros:estado.sopros,params:estado.params,filtroSel:estado.filtroSel};Object.assign(estado,{linhas:p.linhas||[],sopros:p.sopros||[],params:p.params||{pressao:6,taxa:1,margem:1.1},filtroSel:p.filtroSel||filtroSelPadrao()});
  const t=totaisProjeto(),linhas=(p.linhas||[]).map(l=>({l,r:calc(l)})).filter(x=>x.r),sopros=(p.sopros||[]).map(s=>({s,r:calcSopro(s)}));resumos.push({nome:p.nome,cil:t.cil,sop:t.sop,geral:t.geral});
  doc.setFontSize(15);doc.text('CONSUMO PNEUMÁTICO — '+p.nome,14,15);doc.setFontSize(9);doc.text(metadados,14,22);
  doc.setFontSize(11);doc.text('CILINDROS — '+fmt(t.cil)+' L/min',14,29);
  doc.autoTable({startY:32,margin:{left:14,right:14},styles:{fontSize:7,cellPadding:1.4},head:[['TAG','Função','Cilindro','Qtd.','Acion./min','Mangueira','Consumo L/min']],body:linhas.length?linhas.map(({l,r})=>[l.tag||'-',l.descFuncao||'-','Ø'+r.D+' x '+r.C+' mm',fmtL(l.qtd),fmtL(l.acion),r.man?.nome||'-',fmt(r.cons)]):[['-','Sem conjuntos com cilindro','-','-','-','-','0,00']]});
  let y=doc.lastAutoTable.finalY+5;doc.setFontSize(11);doc.text('SOPRADORES — '+fmt(t.sop)+' L/min',14,y);y+=3;
    doc.autoTable({startY:y,margin:{left:10,right:10},styles:{fontSize:6,cellPadding:1},head:[['Identificação','Tipo / item ERP','Válvula','Mangueira','Qtd.','Pressão bar','Tempo s/min','Furos','Cap. máx. item L/min','Vazão mangueira aberta ao ar L/min','Vazão aplicada L/min','Consumo por item L/min','Consumo total L/min','Observação / limite']],body:sopros.length?sopros.map(({s,r},i)=>[s.nome||('Soprador '+(i+1)),[r.sop?.tipo,r.sop?.erpdesc||r.sop?.nome||r.sop?.modelo].filter(Boolean).join(' | ')||'-',r.val?.modelo||'-',r.mang?.nome||'-',fmtL(r.q),fmtL(r.P),fmtL(r.t),textoFuros(r.nf,r.d),fmt(r.vazInf||r.vazEst),r.limiteMangueira>0?fmt(r.vazaoMangueiraAberta):'-',fmt(r.vazao),fmt(r.porSopro),fmt(r.total),r.alerta||s.obs||'-']):[['-','-','-','-','-','-','-','-','-','-','-','-','0,00','-']]});
  y=doc.lastAutoTable.finalY+7;doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text('TOTAL DO PAINEL: '+fmt(t.geral)+' L/min',14,y);doc.setFont('helvetica','normal');Object.assign(estado,antigo);
 });
 doc.addPage();doc.setFontSize(15);doc.text(todosPainels?'RESUMO GERAL DA MÁQUINA':'RESUMO DO PAINEL SELECIONADO',14,16);doc.setFontSize(9);doc.text(metadados,14,23);
 doc.autoTable({startY:30,margin:{left:14,right:14},styles:{fontSize:9,cellPadding:2},head:[['Painel','Cilindros L/min','Sopradores L/min','Total L/min']],body:[...resumos.map(x=>[x.nome,fmt(x.cil),fmt(x.sop),fmt(x.geral)]),[todosPainels?'TOTAL GERAL DA PV':'TOTAL DO PAINEL',fmt(resumos.reduce((a,x)=>a+x.cil,0)),fmt(resumos.reduce((a,x)=>a+x.sop,0)),fmt(resumos.reduce((a,x)=>a+x.geral,0))]]});
 const escopo=todosPainels?'todos_os_paineis':'painel_'+(selecionados[0].nome||'ativo').replace(/[\\/:*?"<>|]/g,'_');return {blob:doc.output('blob'),nome:'consumo_pneumatico_'+escopo+(estado.pv?'_PV'+String(estado.pv).replace(/[\\/:*?"<>|]/g,'_'):'')+'.pdf'};
}
function baixarPdf(a){if(!a)return;const u=URL.createObjectURL(a.blob),x=document.createElement('a');x.href=u;x.download=a.nome;x.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}function pdf(){baixarPdf(gerarPdfOrganizado(true))}carregar();
const blank=snapshot();assinaturaSalva=signature(blank);
['pv','desenho','cliente','projetista','codPai'].forEach(k=>{$(k).value='';$(k).oninput=()=>{estado[k]=$(k).value;salvar();marcarFaltas()}});[['p_pressao','pressao'],['p_taxa','taxa'],['p_margem','margem']].forEach(([id,k])=>{$(id).value=estado.params[k];$(id).oninput=()=>{estado.params[k]=$(id).value;salvar();updateCells()}});
$('add').onclick=()=>{estado.linhas.push({cil:'',val:'',descFuncao:'',qtdVal:1,obs:'',tag:'',qtd:1,acion:1,tempo:1,dist:10,mang:''});salvar();renderProject()};$('addCil').onclick=()=>{estado.cilindros.push({id:'c'+Date.now(),nome:'',diam:'',curso:'',rosca:'',acao:'Dupla ação',tipoHaste:'Simples',diamHaste:'',erp:'',erpdesc:'',obs:''});salvar();renderAll()};$('addVal').onclick=()=>{estado.valvulas.push({id:'v'+Date.now(),modelo:'',vias:'',acionamento:'',tensao:'',vazao:'',rosca:'',erp:'',erpdesc:'',obs:''});salvar();renderAll()};$('addMang').onclick=()=>{estado.mangueiras.push({id:'h'+Date.now(),nome:'',diamInterno:'',areaInterna:'',vazao:'',dmax:'',erp:'',erpdesc:''});salvar();renderAll()};
$('saveProject').onclick=()=>saveProject(false);$('saveProject2').onclick=()=>saveProject(false);$('finishProject').onclick=()=>saveProject(true);$('newProject').onclick=criarNovo;$('openProject').onclick=loadProject;$('copyProject').onclick=()=>{estado.pv=(estado.pv||'Projeto')+' (CÓPIA)';$('pv').value=estado.pv;copiaSemAlteracao=true;saveProject(false,true)};$('pdf').onclick=pdf;
function emailFavorites(){try{return JSON.parse(PneumoStorage.getItem('consumo_pneumatico_emails_favoritos_v1')||'[]')}catch(e){return []}}
function refreshEmailFavorites(){const sel=$('emailFavoritos'),chosen=sel.value;sel.innerHTML='<option value="">Escolha um e-mail favorito</option>';emailFavorites().forEach(address=>{const o=document.createElement('option');o.value=address;o.textContent=address;sel.append(o)});sel.value=chosen}
$('emailFavoritos').onchange=()=>{if($('emailFavoritos').value)$('emailDestino').value=$('emailFavoritos').value};
$('salvarEmailFavorito').onclick=()=>{const address=$('emailDestino').value.trim();if(!address||!$('emailDestino').checkValidity()){alert('Digite um endereço de e-mail válido para salvar.');return}const list=emailFavorites();if(list.some(x=>x.toLowerCase()===address.toLowerCase())){alert('Esse e-mail já está salvo nos favoritos.');return}list.push(address);try{PneumoStorage.setItem('consumo_pneumatico_emails_favoritos_v1',JSON.stringify(list));refreshEmailFavorites();$('emailFavoritos').value=address;alert('E-mail salvo nos favoritos deste navegador.')}catch(e){alert('Não foi possível salvar o favorito neste navegador.')}};$('emailProject').onclick=()=>{
 const email=$('emailDestino').value.trim();/* e-mail vazio não bloqueia: o programa de e-mail abre mesmo assim */
 const linhas=estado.linhas.map((l,i)=>({l,r:calc(l),i})).filter(x=>x.r);const total=linhas.reduce((a,x)=>a+x.r.cons,0);const qtdCil=linhas.reduce((a,x)=>a+x.r.q,0);const qtdVal=qtdValvulasProjeto(),tp=totaisProjeto(); // válvulas incluem as de linhas de soprador; tp = totais com sopradores
 const itens=listaMateriais(); // peças totalizadas por código ERP (cilindros, válvulas e mangueiras)
 const pai=String(estado.codPai||'').trim()||'-'; // código pai vem de "Dados do projeto" (vazio vira "-"); não pergunta nada
 const T='\t'; // separador de colunas, igual ao modelo (dá para colar no Excel)
 const lista=itens.length?linhasMateriais(itens,pai).map(x=>x.join(T)):['-'+T+'-'+T+'-'+T+'-'+T+'-']; // uma linha por peça
 const body=['RESUMO DO PROJETO PNEUMÁTICO','PV: '+(estado.pv||'-'),'Desenho: '+(estado.desenho||'-'),'Cliente: '+(estado.cliente||'-'),'Projetista: '+(estado.projetista||'-'),...resumoPaineis(),...(estado.sopros.length?['CONSUMO TOTAL – VÁLVULAS/CILINDROS: '+fmt(tp.cil)+' L/min','CONSUMO TOTAL – SOPRADORES: '+fmt(tp.sop)+' L/min','CONSUMO TOTAL DO PROJETO: '+fmt(tp.geral)+' L/min']:['Consumo total: '+fmt(total)+' L/min']),'Quantidade total de cilindros: '+fmt(qtdCil,0),'Quantidade total de válvulas: '+fmt(qtdVal,0),'', // resumo do projeto
  'DELTA EQUIPAMENTOS LTDA','Projeto:'+T+(estado.desenho||'-'),'Pedido de Venda:'+T+(estado.pv||'-'),'Cliente:'+T+(estado.cliente||'-'),'','Lista de Peças Totalizadas para Integração com ERP','', // cabeçalho da lista
  ['COD PAI','COD FILHO','Descrição','Qtde.','Comprimento'].join(T),...lista].join('\n'); // títulos + peças
 const url='mailto:'+encodeURIComponent(email)+'?subject='+encodeURIComponent('Projeto pneumático '+(estado.pv||''))+'&body='+encodeURIComponent(body);
 const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';document.body.append(a);a.click();a.remove(); // abre o e-mail à parte: a tela do sistema não é trocada nem fechada
};
$('exportProject').onclick=()=>{const a=document.createElement('a'),u=URL.createObjectURL(new Blob([JSON.stringify(snapshot(),null,2)],{type:'application/json'}));a.href=u;a.download='projeto_'+(estado.pv||'pneumatico')+'.json';a.click();URL.revokeObjectURL(u)};$('logout').onclick=()=>{PneumoStorage.logout();$('loginGate').hidden=false;$('loginPass').value='';$('sharedSyncStatus').textContent='Faça login para sincronizar.'};$('pdf').onclick=pdf;
$('exportCatalogs').onclick=()=>{const a=document.createElement('a'),u=URL.createObjectURL(new Blob([JSON.stringify(catalogosEstado(),null,2)],{type:'application/json'}));a.href=u;a.download='catalogos-pneumatico.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)};
document.querySelectorAll('details.sec').forEach(d=>d.addEventListener('toggle',()=>{if(d.open){document.querySelectorAll('details.sec').forEach(x=>{if(x!==d)x.open=false});renderAll()}sincronizarNav()})); // ao abrir uma aba fecha as outras; sempre atualiza o destaque do botão
function sincronizarNav(){document.querySelectorAll('.navlinks button').forEach(x=>{const d=$(x.dataset.target);x.classList.toggle('on',!!d&&d.tagName==='DETAILS'&&d.open)})} // destaca só o botão da aba que está aberta
document.querySelectorAll('.navlinks button').forEach(b=>b.onclick=()=>{
 const id=b.dataset.target; // qual aba o botão controla
 if(id==='conjuntos'){document.querySelectorAll('details.sec').forEach(d=>d.open=false);$('conjuntos').scrollIntoView({behavior:'smooth',block:'start'});} // mantido como estava
 else{const d=$(id);if(d.open){d.open=false} /* já estava aberta: minimiza */ else{d.open=true;d.scrollIntoView({behavior:'smooth',block:'start'})} /* estava fechada: abre */}
 sincronizarNav();
});
/* ===== LARGURA DAS COLUNAS AJUSTÁVEL ===== */
const LARG_KEY='consumo_pneumatico_larguras_v1'; // onde as larguras ficam salvas no navegador
function largSalvas(){try{return JSON.parse(PneumoStorage.getItem(LARG_KEY)||'{}')}catch(e){return {}}} // lê as larguras salvas
function ativarRedimensionar(theadId){ // liga o ajuste de largura em um cabeçalho de tabela
 const thead=$(theadId),tabela=thead.closest('table'),ths=[...thead.querySelectorAll('th')];
 // soma as larguras das colunas e aplica na tabela (modo fixo)
 function aplicaTabela(){tabela.classList.add('redim');tabela.style.width=ths.reduce((s,t)=>s+(parseFloat(t.style.width)||t.offsetWidth),0)+'px'}
 const salvo=largSalvas()[theadId]; // larguras salvas desta tabela
 if(salvo&&salvo.length===ths.length){ths.forEach((t,i)=>t.style.width=salvo[i]+'px');aplicaTabela()} // reaplica após redesenhar
 ths.forEach((th,i)=>{
  if(i===ths.length-1)return; // última coluna (botão ×) não é ajustável
  const g=document.createElement('span');g.className='grip';th.append(g); // cria a alça na borda direita
  g.onpointerdown=e=>{ // começou a arrastar (mouse ou toque)
   e.preventDefault();
   ths.forEach(t=>t.style.width=t.offsetWidth+'px');aplicaTabela(); // "congela" as larguras atuais
   const x0=e.clientX,w0=th.offsetWidth;g.setPointerCapture(e.pointerId);
   g.onpointermove=ev=>{th.style.width=Math.max(40,w0+ev.clientX-x0)+'px';aplicaTabela()}; // muda só esta coluna (mínimo 40px)
   g.onpointerup=()=>{ // soltou: salva as larguras
    g.onpointermove=null;g.onpointerup=null;
    const s=largSalvas();s[theadId]=ths.map(t=>t.offsetWidth);
    try{PneumoStorage.setItem(LARG_KEY,JSON.stringify(s))}catch(x){}
   };
  };
 });
}
// as tabelas são redesenhadas a toda hora: este observador reaplica as alças sempre que o cabeçalho é recriado
['cabCil','cabVal','cabMang','cabProj','cabSop','cabBico','cabSopCat','cabFiltro'].forEach(id=>new MutationObserver(()=>ativarRedimensionar(id)).observe($(id),{childList:true}));

/* ===== EXCLUIR PROJETO SALVO ===== */
$('deleteProject').onclick=()=>{
 const id=$('savedProjects').value; // projeto escolhido na lista
 if(!id){alert('Selecione um projeto salvo para excluir.');return}
 const p=allProjects().find(x=>x.id===id);
 if(!confirm('Excluir o projeto "'+(p?.pv||'Sem PV')+' — '+(p?.cliente||'Sem cliente')+'"? Não dá para desfazer.'))return; // confirmação
 try{PneumoStorage.setItem(PROJECTS_KEY,JSON.stringify(allProjects().filter(x=>x.id!==id)))} // regrava a lista sem ele
 catch(e){alert('Não foi possível excluir.');return}
 if(projetoAtualId===id){projetoAtualId='';assinaturaSalva='';PneumoStorage.removeItem('consumo_pneumatico_projeto_atual')} // se estava aberto, vira "não salvo"
 refreshProjects(); // atualiza a lista na tela
};

/* ===== EXCLUIR E-MAIL FAVORITO (adicionar já existe no botão "Salvar favorito") ===== */
$('excluirEmailFavorito').onclick=()=>{
 const address=$('emailFavoritos').value; // favorito escolhido na lista
 if(!address){alert('Escolha um e-mail favorito na lista para excluir.');return}
 if(!confirm('Remover "'+address+'" dos favoritos?'))return; // confirmação
 try{PneumoStorage.setItem('consumo_pneumatico_emails_favoritos_v1',JSON.stringify(emailFavorites().filter(x=>x!==address)))} // regrava sem ele
 catch(e){alert('Não foi possível excluir o favorito.');return}
 refreshEmailFavorites(); // atualiza a lista na tela
};
/* ===== SALVAMENTO AUTOMÁTICO + AVISO AO SAIR/ATUALIZAR ===== */
const AUTO_KEY='consumo_pneumatico_autosave_v1'; // guarda se o salvamento automático está ligado
let ultimoAuto=''; // hora do último salvamento automático (aparece na tela)
try{$('autoSave').checked=PneumoStorage.getItem(AUTO_KEY)==='1'}catch(e){} // lembra a escolha (começa desligado)
function autoPodeSalvar(){return ['pv','cliente','projetista'].every(k=>String(estado[k]||'').trim()!=='')} // mínimo exigido: PV, cliente e projetista preenchidos
function temAlteracaoProjeto(){ // há dados do projeto sem salvar? (ignora os catálogos, que já ficam guardados sozinhos no navegador)
 const corta=t=>{try{const o=JSON.parse(t);['cilindros','valvulas','mangueiras','bicos','sopradores','filtros'].forEach(k=>delete o[k]);return JSON.stringify(o)}catch(e){return t}};
 return corta(signature())!==corta(assinaturaSalva);
}
function autoTick(){ // roda a cada 5 segundos e também na hora de sair
 const st=$('autoSaveStatus');
 if(!$('autoSave').checked){st.textContent='';st.className='';return} // desligado: não faz nada
 if(!autoPodeSalvar()){st.textContent='Preencha PV, cliente e projetista para o salvamento automático funcionar.';st.className='aviso';return} // falta o mínimo
 st.className='';
 if(!assinaturaSalva||signature()!==assinaturaSalva){ // existe alteração ainda não salva
  const atual=allProjects().find(x=>x.id===projetoAtualId); // mantém o status "finalizado" como está
  if(saveProject(!!atual?.finalizado,false,true))ultimoAuto=new Date().toLocaleTimeString('pt-BR'); // salva sem alertas
 }
 st.textContent=ultimoAuto?'Salvo automaticamente às '+ultimoAuto:'Ativado: salva quando houver alterações.';
}
$('autoSave').onchange=()=>{try{PneumoStorage.setItem(AUTO_KEY,$('autoSave').checked?'1':'0')}catch(e){}autoTick()}; // liga/desliga e guarda a escolha
setInterval(autoTick,5000); // verifica a cada 5 s
window.addEventListener('beforeunload',e=>{ // F5, fechar aba ou fechar o navegador
 if($('autoSave').checked&&autoPodeSalvar())autoTick(); // com o automático ligado, salva na hora antes de sair
 if(temAlteracaoProjeto()){e.preventDefault();e.returnValue=''} // ainda há algo sem salvar: o navegador mostra o aviso de saída
});
/* ===== LISTA DE MATERIAIS (PDF e e-mail) ===== */
function listaMateriaisPainel(){ // soma as peças do projeto por código ERP
 const mapa=new Map(); // chave = tipo + código ERP (peças iguais viram uma linha só)
 function soma(chave,erp,desc,qtd,comp){ // acumula quantidade (e comprimento, quando houver)
  const m=mapa.get(chave)||{erp,desc,qtd:0,comp:0,temComp:false};
  m.qtd+=qtd;if(comp!==null){m.comp+=comp;m.temComp=true}
  mapa.set(chave,m);
 }
 estado.linhas.forEach(l=>{
  const r=calc(l);
  if(!r){ // linha sem cilindro: só conta se for linha de soprador com válvula escolhida
   return;
  }
  const q=num(l.qtd); // quantidade de cilindros do conjunto
  soma('c|'+(r.c.erp||r.c.id),r.c.erp,r.c.erpdesc||r.c.nome,q,null); // cilindro: qtd de cilindros
  if(r.v)soma('v|'+(r.v.erp||r.v.id),r.v.erp,r.v.erpdesc||r.v.modelo,num(l.qtdVal),null); // válvula: qtd de válvulas
  if(r.man)soma('m|'+(r.man.erp||r.man.id),r.man.erp,r.man.erpdesc||r.man.nome,q,r.dist*q); // mangueira: qtd = nº de cilindros; comprimento = distância × cilindros (m)
 });
 estado.sopros.forEach(s=>{const r=calcSopro(s);if(!r.sop)return;const q=num(s.qtd);soma('s|'+(r.sop.erp||r.sop.id),r.sop.erp,[r.sop.tipo,r.sop.erpdesc||r.sop.nome||r.sop.modelo].filter(Boolean).join(' — '),q,null);if(r.bico&&r.bico.id!==r.sop.id)soma('b|'+(r.bico.erp||r.bico.id),r.bico.erp,r.bico.erpdesc||r.bico.modelo,q,null);if(r.val)soma('v|'+(r.val.erp||r.val.id),r.val.erp,r.val.erpdesc||r.val.modelo,q,null);if(r.mang)soma('m|'+(r.mang.erp||r.mang.id),r.mang.erp,r.mang.erpdesc||r.mang.nome,q,null)}); filtrosSelecionados().forEach(x=>{if(x.f)soma('f|'+(x.f.erp||x.f.id),x.f.erp,x.f.erpdesc||x.f.nome,1,null)}); // filtros de ar escolhidos (1 de cada)
 return [...mapa.values()];
}
function listaMateriais(){
 gravarPainelAtivo();const mapa=new Map();
 for(const p of estado.paineis){const old={linhas:estado.linhas,sopros:estado.sopros,params:estado.params,filtroSel:estado.filtroSel};Object.assign(estado,{linhas:p.linhas||[],sopros:p.sopros||[],params:p.params||{pressao:6,taxa:1,margem:1.1},filtroSel:p.filtroSel||filtroSelPadrao()});
  listaMateriaisPainel().forEach(i=>{const k=String(i.erp||'')+'|'+String(i.desc||'');const x=mapa.get(k)||{...i,qtd:0,comp:0,temComp:false};x.qtd+=i.qtd;if(i.temComp){x.comp+=i.comp;x.temComp=true}mapa.set(k,x)});Object.assign(estado,old)}return [...mapa.values()]
}function linhasMateriais(itens,pai){ // monta as linhas da tabela: COD PAI, COD FILHO, Descrição, Qtde., Comprimento
 return itens.map(i=>[pai,i.erp||'SEM CÓD. ERP',i.desc||'-',fmt(i.qtd,Number.isInteger(i.qtd)?0:2),i.temComp?fmt(i.comp)+' m':'-']);
}
function gerarPdfMateriais(){
 const itens=listaMateriais();
 const pai=String(estado.codPai||'').trim()||'-'; // código pai vem de "Dados do projeto" (vazio vira "-"); não pergunta nada
 const {jsPDF}=window.jspdf,doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
 doc.setFont('helvetica','bold');doc.setFontSize(14);doc.text('DELTA EQUIPAMENTOS LTDA',14,16); // empresa
 doc.setFont('helvetica','normal');doc.setFontSize(10);
 doc.text('Projeto:',14,25);doc.text(String(estado.desenho||'-'),50,25); // projeto = nº do desenho
 doc.text('Pedido de Venda:',14,31);doc.text(String(estado.pv||'-'),50,31);
 doc.text('Cliente:',14,37);doc.text(String(estado.cliente||'-'),50,37);
 doc.setFont('helvetica','bold');doc.text('Lista de Peças Totalizadas para Integração com ERP',14,47); // título da lista
 doc.autoTable({startY:51,styles:{fontSize:9},headStyles:{fillColor:[20,91,121]},head:[['COD PAI','COD FILHO','Descrição','Qtde.','Comprimento']],body:itens.length?linhasMateriais(itens,pai):[['-','-','-','-','-']],columnStyles:{3:{halign:'right'},4:{halign:'right'}}});
 baixarPdf({blob:doc.output('blob'),nome:'lista_materiais'+(estado.pv?'_PV'+String(estado.pv).replace(/[\\/:*?"<>|]/g,'_'):'')+'.pdf'});
}
$('pdfMateriais').onclick=gerarPdfMateriais;
/* ===== EXCEL: CONJUNTOS (COM FÓRMULAS) E LISTA DE MATERIAIS ===== */
const XLSX_TIPO='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; // tipo do arquivo .xlsx
const FIM_CAT=200; // as listas de seleção e as buscas leem os catálogos até esta linha do Excel
const BORDA_X={top:{style:'thin',color:{argb:'FFD5DCE3'}},left:{style:'thin',color:{argb:'FFD5DCE3'}},bottom:{style:'thin',color:{argb:'FFD5DCE3'}},right:{style:'thin',color:{argb:'FFD5DCE3'}}}; // borda fina cinza
const FILL_CALC={type:'pattern',pattern:'solid',fgColor:{argb:'FFE6F3F7'}}; // azul claro = célula com fórmula (não editar)
function bibliotecaExcel(){ // confere se a biblioteca ExcelJS carregou (ela vem da internet)
 if(typeof ExcelJS==='undefined'){alert('A biblioteca do Excel não carregou. Verifique a internet e atualize a página.');return false}
 return true;
}
function nomeXlsx(prefixo){return prefixo+(estado.pv?'_PV'+String(estado.pv).replace(/[\\/:*?"<>|]/g,'_'):'')+'.xlsx'} // nome do arquivo com o PV
function baixarXlsx(wb,nome){ // gera o arquivo .xlsx e baixa (baixarPdf serve para qualquer arquivo)
 return wb.xlsx.writeBuffer().then(buf=>baixarPdf({blob:new Blob([buf],{type:XLSX_TIPO}),nome})).catch(e=>{console.error(e);alert('Não foi possível gerar o Excel.')});
}
function cabX(c,texto,cor){ // estilo de título de coluna: fundo azul, letra branca em negrito
 c.value=texto;c.font={bold:true,color:{argb:'FFFFFFFF'}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:cor||'FF145B79'}};
 c.alignment={vertical:'middle',horizontal:'center',wrapText:true};c.border=BORDA_X;
}
const numX=v=>String(v??'').trim()===''?null:num(v); // número do sistema (aceita vírgula); vazio vira célula vazia
function catalogoX(ws,titulos,linhas,larguras,notaA){ // preenche uma aba de catálogo: linha 1 = títulos, abaixo os itens
 titulos.forEach((t,i)=>{cabX(ws.getCell(1,i+1),t);ws.getColumn(i+1).width=larguras[i]});
 ws.getCell(1,1).note=notaA;
 linhas.forEach((lin,r)=>lin.forEach((v,i)=>{const c=ws.getCell(r+2,i+1);c.value=v;c.border=BORDA_X}));
 ws.views=[{state:'frozen',ySplit:1}]; // título fixo ao rolar
}
function gerarExcelConjuntos(){
 if(!bibliotecaExcel())return;
 const wb=new ExcelJS.Workbook();wb.calcProperties=wb.calcProperties||{};wb.calcProperties.fullCalcOnLoad=true; // o Excel recalcula tudo ao abrir
 const rotCil=c=>[c.erp,c.erpdesc,c.nome].filter(Boolean).join(' | '),rotVal=v=>v.modelo+' ('+v.vias+')'; // mesmo texto das listas do sistema
 const wsResumo=wb.addWorksheet('Resumo painéis'),wsDetalhe=wb.addWorksheet('Detalhe painéis'),ws=wb.addWorksheet('Conjuntos'),wsS=wb.addWorksheet('Sopradores'),wc=wb.addWorksheet('Cilindros'),wv=wb.addWorksheet('Válvulas'),wm=wb.addWorksheet('Mangueiras'),wpd=wb.addWorksheet('Bicos sopradores'),wcs=wb.addWorksheet('Cat. sopradores'),wp=wb.addWorksheet('Parâmetros'),wf=wb.addWorksheet('Filtros de ar'),wfs=wb.addWorksheet('Filtros sugeridos'),witems=wb.addWorksheet('Itens sopro e vácuo'),wactive=wb.addWorksheet('Sopro ativo');
 /* ---- abas de catálogo (o que for editado aqui recalcula a aba Conjuntos) ---- */
 catalogoX(wc,['Texto da lista (seleção)','Nome/descrição','Diâmetro (mm)','Curso (mm)','Tipo de ação','Tipo de haste','Diâmetro da haste (mm)','Rosca','Código ERP','Descrição ERP','Características / observações'],
  estado.cilindros.map(c=>[rotCil(c)||null,c.nome||null,numX(c.diam),numX(c.curso),c.acao||null,c.tipoHaste||'Simples',numX(c.diamHaste),c.rosca||null,c.erp||null,c.erpdesc||null,c.obs||null]),
  [44,30,14,12,14,14,16,10,16,44,30],'Texto que aparece na lista da aba Conjuntos. Ao cadastrar um cilindro novo, escreva aqui o texto (ex.: código | descrição). Tipo de haste: Simples ou Dupla.');
 catalogoX(wv,['Texto da lista (seleção)','Modelo','Vias','Acionamento','Tensão','Vazão l/min','Rosca','Código ERP','Descrição ERP','Características / observações'],
  estado.valvulas.map(v=>[rotVal(v),v.modelo||null,v.vias||null,v.acionamento||null,v.tensao||null,numX(v.vazao),v.rosca||null,v.erp||null,v.erpdesc||null,v.obs||null]),
  [34,20,8,14,12,12,10,16,48,30],'Texto que aparece na lista da aba Conjuntos. Ao cadastrar uma válvula nova, escreva aqui o texto (ex.: modelo (vias)).');
 catalogoX(wm,['Mangueira','Diâmetro interno (mm)','Área interna (mm²)','Vazão máx. (l/min)','Distância máx. (m)','Código ERP','Descrição ERP'],
  estado.mangueiras.map(m=>[m.nome||null,numX(m.diamInterno),numX(m.areaInterna),numX(m.vazao),numX(m.dmax),m.erp||null,m.erpdesc||null]),
  [24,18,18,18,18,16,36],'A mangueira limita o soprador pelo diâmetro interno e/ou pela vazão máxima cadastrada.');
 /* ---- abas de catálogo dos sopradores ---- */
 const bicosX=estado.bicos; // catálogo legado mantido para compatibilidade com fórmulas antigas
 catalogoX(wpd,['Texto da lista (seleção)','Tipo de peça','Modelo','Qtd. de furos','Diâmetro dos furos (mm)','Código ERP','Descrição ERP','Características / observações'],
  bicosX.map(b=>[rotBico(b),b.tipo||'Bico de sopro',b.modelo||null,numX(b.nfuros),numX(b.dfuro),b.erp||null,b.erpdesc||null,b.obs||null]),
  [44,18,20,14,18,16,44,30],'Texto que aparece na lista da aba Sopradores. Uma peça pode ter vários furos: a área total é Qtd. de furos × π × d² ÷ 4.');
 catalogoX(wcs,['Texto da lista (seleção)','Modelo','Bico (texto igual ao da aba Bicos sopradores)','Qtd. de furos (sem bico)','Ø dos furos (sem bico) mm','Vazão informada l/min','Pressão P (bar)','Tempo acionado (s/min)','Código ERP','Descrição ERP','Observações'],
  estado.sopradores.map(s=>{const bo=estado.bicos.find(x=>x.id===s.bico);return [rotSop(s),s.modelo||null,bo?rotBico(bo):null,numX(s.nfuros),numX(s.dfuro),numX(s.vazao),numX(s.pressao),numX(s.tempo),s.erp||null,s.erpdesc||null,s.obs||null]}),
  [44,18,44,16,16,16,14,16,16,44,30],'Aba legada, mantida apenas para compatibilidade. Use a aba Itens sopro e vácuo para o catálogo consolidado.');
 catalogoX(witems,['Tipo','Nome / modelo','Código ERP','Descrição ERP','Qtd. furos','Diâmetro do furo (mm)','Pressão máxima (bar)','Capacidade máxima (l/min)','Observações'],
  estado.sopradores.map(s=>[s.tipo||null,s.nome||s.modelo||null,s.erp||null,s.erpdesc||null,numX(s.nfuros),numX(s.dfuro),numX(s.pressaoMax),numX(s.vazao),s.obs||null]),
  [22,30,16,44,14,20,20,22,36],'Cadastro único compartilhado entre painéis. A vazão aplicada é limitada pela capacidade do item e pela mangueira selecionada.');
 wpd.state='hidden';wcs.state='hidden';wsS.state='hidden';
 /* ---- abas dos filtros de ar (catálogo e filtros sugeridos; valores, sem fórmulas) ---- */
 catalogoX(wf,['Tipo','Nome','Código ERP','Descrição ERP','Encaixe','Largura (mm)','Altura (mm)','Profundidade (mm)','Capacidade de vazão (l/min)','Pressão máxima (bar)','Faixa de regulagem (bar)','Grau de filtragem (µm)','Dreno','Observação'],
  estado.filtros.map(f=>[f.tipo||null,f.nome||null,f.erp||null,f.erpdesc||null,f.rosca||null,numX(f.largura),numX(f.altura),numX(f.profund),numX(f.vazao),numX(f.pressaoMax),f.faixaReg||null,f.filtragem||null,f.dreno||null,f.obs||null]),
  [26,24,16,44,12,12,12,16,18,16,18,16,14,30],'Catálogo de filtros de ar cadastrados no sistema.');
 catalogoX(wfs,['Tipo','Escolha','Código ERP','Descrição ERP','Encaixe','Capacidade (l/min)','Consumo do projeto (l/min)','Situação'],
  filtrosSelecionados().filter(x=>x.usar).map(x=>[x.nomeTipo,x.modo,x.f?.erp||null,x.f?(x.f.erpdesc||x.f.nome||null):null,x.f?.rosca||null,x.f?numX(x.f.vazao):null,Number(x.demanda.toFixed(2)),x.status]),
  [26,14,16,44,12,18,22,50],'Filtros sugeridos (ou escolhidos manualmente) para o consumo total do projeto.');
 /* ---- aba Parâmetros ---- */
 cabX(wp.getCell('A1'),'Parâmetro');cabX(wp.getCell('B1'),'Valor');
 [['Pressão manométrica P (bar)',num(estado.params.pressao)],['Pressão atmosférica Patm (bar)',num(estado.params.taxa)],['Margem de segurança (multiplicador)',num(estado.params.margem)]].forEach(([t,v],i)=>{
  wp.getCell(i+2,1).value=t;wp.getCell(i+2,2).value=v;wp.getCell(i+2,1).border=BORDA_X;wp.getCell(i+2,2).border=BORDA_X});
 wp.getCell('A5').value='Patm usada no cálculo (se Patm = 0, usa 1)';wp.getCell('B5').value={formula:'IF(B3=0,1,B3)',result:num(estado.params.taxa)||1};wp.getCell('B5').fill=FILL_CALC;
 wp.getCell('A7').value='Edite só os valores da coluna B (linhas 2 a 4). A linha 5 é fórmula.';
 wp.getColumn(1).width=46;wp.getColumn(2).width=14;
 /* ---- aba Conjuntos ---- */
 const linhasX=estado.linhas.filter(l=>!(l.sopro&&!l.cil)); // linhas de soprador sem cilindro ficam só na aba Sopradores
 const HR=8,PRIM=9,ULT=PRIM+Math.max(linhasX.length+20,30)-1; // título na linha 8, dados a partir da 9 (com 20 linhas reserva)
 const P="'Parâmetros'!$B$2",PA="'Parâmetros'!$B$5",MG="'Parâmetros'!$B$4"; // pressão, Patm usada e margem
 const CI=col=>'Cilindros!$'+col+'$2:$'+col+'$'+FIM_CAT,MA='Mangueiras!$A$2:$A$'+FIM_CAT,MB='Mangueiras!$B$2:$B$'+FIM_CAT,MC='Mangueiras!$C$2:$C$'+FIM_CAT; // faixas dos catálogos
 const titulos=['Cilindro ERP / descrição','Descrição da função','Dimensões','Válvula / modelo','Qtd. válvulas','TAG','Qtd. cilindros','Acion./min','Tempo (s)','Dist. (m)','Mangueira manual','Mangueira usada','Vazão l/min','Consumo l/min','Força avanço kgf','Força recuo kgf','Observações do conjunto',
  'Ø êmbolo (mm)','Curso (mm)','Ø haste (mm)','Tipo de haste','Área êmbolo (cm²)','Área haste (cm²)','Área recuo (cm²)','Área avanço (cm²)','Vol. avanço (cm³)','Vol. recuo (cm³)','Fator de compressão','Ar por ciclo (cm³)'];
 const larg=[46,28,18,26,10,10,10,10,10,10,16,16,12,14,14,14,28,12,12,12,12,14,14,14,14,14,14,14,16];
 const notas={12:'Automática: menor vazão cadastrada cuja distância máxima atende a distância (Dist.). Para trocar, escolha uma mangueira em "Mangueira manual".',
  14:'Consumo = Cc × acionamentos/min × qtd. cilindros × margem ÷ 1000  (resultado em l/min)',15:'Fa = Aav × P × 1,0197  (kgf, força teórica)',16:'Fr = Ar × P × 1,0197  (kgf, força teórica)',
  18:'Vem da aba Cilindros (diâmetro do êmbolo).',19:'Vem da aba Cilindros (curso).',20:'Vem da aba Cilindros (diâmetro da haste).',21:'Vem da aba Cilindros (Simples ou Dupla).',
  22:'A = π × (D ÷ 10)² ÷ 4  (cm²)',23:'Ah = π × (dh ÷ 10)² ÷ 4  (cm²)',24:'Ar = A − Ah  (não menor que zero)',25:'Haste simples: Aav = A. Haste dupla: Aav = Ar.',
  26:'Vav = Aav × (C ÷ 10)  (cm³)',27:'Vrec = Ar × (C ÷ 10)  (cm³)',28:'Fc = (P + Patm) ÷ Patm',29:'Cc = (Vav + Vrec) × Fc  (cm³ por ciclo)'};
 titulos.forEach((t,i)=>{cabX(ws.getCell(HR,i+1),t,i>=17?'FF5B7F95':null);ws.getColumn(i+1).width=larg[i];if(notas[i+1])ws.getCell(HR,i+1).note=notas[i+1]});
 ws.getRow(HR).height=32;
 ws.getCell('A1').value='RESUMO DE CONSUMO PNEUMÁTICO';ws.getCell('A1').font={bold:true,size:14};
 ws.getCell('A2').value='PV: '+(estado.pv||'-')+' | Desenho: '+(estado.desenho||'-')+' | Cliente: '+(estado.cliente||'-')+' | Projetista: '+(estado.projetista||'-');
 ws.getCell('A7').value='Preencha as colunas sem cor (A a K e Q). As colunas em azul claro são fórmulas: não edite. Pressão, Patm e margem ficam na aba Parâmetros. Sopradores: aba Sopradores.';
 ws.getCell('R7').value='Cálculo intermediário (equações) →';ws.getCell('R7').font={bold:true};
 let total=0,qCil=0,qVal=0;
 for(let r=PRIM;r<=ULT;r++){
  const l=linhasX[r-PRIM],res=l?calc(l):null; // conjunto do projeto (ou linha reserva vazia) e o cálculo dele
  const cil=l?estado.cilindros.find(x=>x.id===l.cil):null,val=l?estado.valvulas.find(x=>x.id===l.val):null,man=l?estado.mangueiras.find(x=>x.id===l.mang):null;
  const ent=(col,v)=>{const c=ws.getCell(col+r);c.value=v;c.border=BORDA_X}; // célula de entrada (você preenche)
  const fx=(col,formula,result,fmt)=>{const c=ws.getCell(col+r);c.value={formula,result:result??''};c.border=BORDA_X;c.fill=FILL_CALC;if(fmt)c.numFmt=fmt}; // célula com fórmula
  ent('A',cil?rotCil(cil):null);ent('B',l?(l.descFuncao||null):null);ent('D',val?rotVal(val):null);ent('E',l?numX(l.qtdVal):null);ent('F',l?(l.tag||null):null);
  ent('G',l?numX(l.qtd):null);ent('H',l?numX(l.acion):null);ent('I',l?numX(l.tempo):null);ent('J',l?numX(l.dist):null);ent('K',man?man.nome:null);ent('Q',l?(l.obs||null):null);
  ws.getCell('A'+r).dataValidation={type:'list',allowBlank:true,formulae:['Cilindros!$A$2:$A$'+FIM_CAT]}; // listas de seleção
  ws.getCell('D'+r).dataValidation={type:'list',allowBlank:true,formulae:["'Válvulas'!$A$2:$A$"+FIM_CAT]};
  ws.getCell('K'+r).dataValidation={type:'list',allowBlank:true,formulae:[MA]};
  const A=`$A${r}=""`; // "sem cilindro escolhido": as fórmulas ficam vazias
  const busca=(col,padrao)=>`IF(${A},"",IFERROR(INDEX(${CI(col)},MATCH($A${r},${CI('A')},0)),${padrao}))`; // lê um dado do catálogo de cilindros
  const menor=`_xlfn.MINIFS(${MB},${MC},">="&N($J${r}))`; // menor vazão de mangueira que atende a distância
  fx('R',busca('C',0),res&&res.D,'0.##');fx('S',busca('D',0),res&&res.C,'0.##');fx('T',busca('G',0),res&&res.dh,'0.##');fx('U',busca('F','"Simples"'),res&&(res.c.tipoHaste||'Simples'));
  fx('V',`IF(${A},"",PI()*(R${r}/10)^2/4)`,res&&res.area,'#,##0.00');
  fx('W',`IF(${A},"",PI()*(T${r}/10)^2/4)`,res&&res.areaHaste,'#,##0.00');
  fx('X',`IF(${A},"",MAX(0,V${r}-W${r}))`,res&&res.areaRecuo,'#,##0.00');
  fx('Y',`IF(${A},"",IF(LOWER(U${r})="dupla",X${r},V${r}))`,res&&res.areaAvanco,'#,##0.00');
  fx('Z',`IF(${A},"",Y${r}*(S${r}/10))`,res&&res.volAvanco,'#,##0.00');
  fx('AA',`IF(${A},"",X${r}*(S${r}/10))`,res&&res.volRecuo,'#,##0.00');
  fx('AB',`IF(${A},"",(${P}+${PA})/${PA})`,res&&res.fc,'0.0000');
  fx('AC',`IF(${A},"",(Z${r}+AA${r})*AB${r})`,res&&res.ciclo,'#,##0.00');
  fx('C',`IF(${A},"","Ø"&R${r}&" x "&S${r}&" mm")`,res&&('Ø'+res.D+' x '+res.C+' mm'));
  fx('L',`IF(${A},"",IF($K${r}<>"",$K${r},IF(${menor}=0,"-",INDEX(${MA},MATCH(${menor},${MB},0)))))`,res&&(res.man?res.man.nome:'-'));
  fx('M',`IF(${A},"",IFERROR(INDEX(${MB},MATCH($L${r},${MA},0)),"-"))`,res&&(res.man?num(res.man.vazao):'-'),'#,##0.00');
  fx('N',`IF(${A},"",AC${r}*H${r}*G${r}*${MG}/1000)`,res&&res.cons,'#,##0.00');
  fx('O',`IF(${A},"",Y${r}*${P}*1.0197)`,res&&res.forcaAvanco,'#,##0.00');
  fx('P',`IF(${A},"",X${r}*${P}*1.0197)`,res&&res.forcaRecuo,'#,##0.00');
  if(res){total+=res.cons;qCil+=res.q;qVal+=num(l.qtdVal)}
 }
 /* ---- aba Sopradores (projeto) ---- */
 const HS=5,PS=6,US=PS+Math.max(estado.sopros.length+10,15)-1; // título na linha 5, dados a partir da 6 (com linhas reserva)
 const CSr=col=>"'Cat. sopradores'!$"+col+'$2:$'+col+'$'+FIM_CAT,PDr=col=>"'Bicos sopradores'!$"+col+'$2:$'+col+'$'+FIM_CAT; // faixas dos catálogos de sopradores e peças divergentes
 const tituloS=['Identificação','Conjunto (linha / TAG)','Soprador (cadastro)','Bico (vazio = do soprador)','Qtd. sopradores','Pressão P (bar) (vazio = padrão)','Tempo acionado (s/min) (vazio = padrão)','Válvula (linha sem cilindro)','Qtd. válvulas','Bico usado','Qtd. de furos','Ø furo (mm)','Pressão usada (bar)','Tempo usado (s/min)','Área total dos furos (mm²)','Vazão estimada (l/min)','Vazão informada (l/min)','Vazão usada (l/min)','Consumo por soprador (l/min)','Consumo total (l/min)'];
 const largS=[26,30,40,36,12,16,18,30,10,36,10,10,12,12,16,16,16,16,18,16];
 const notasS={10:'Bico da linha; se estiver vazio, o bico do cadastro do soprador.',11:'Do bico escolhido; sem bico, do próprio cadastro do soprador.',12:'Diâmetro de cada furo.',
  13:'Pressão da linha; se vazia, a do cadastro do soprador; se vazia, a da aba Parâmetros.',14:'Tempo da linha; se vazio, o do cadastro do soprador.',15:'A = n × π × d² ÷ 4  (mm²)',16:'Q = 10,2 × A × (P + 1,013)  (l/min)',
  17:'Vazão informada no cadastro do soprador (opcional).',18:'Se houver vazão informada, usa ela; senão, a estimada.',19:'C1 = Q × t ÷ 60  (l/min)',20:'Ct = C1 × quantidade de sopradores  (l/min)'};
 tituloS.forEach((t,i)=>{cabX(wsS.getCell(HS,i+1),t,i>=9?'FF5B7F95':null);wsS.getColumn(i+1).width=largS[i];if(notasS[i+1])wsS.getCell(HS,i+1).note=notasS[i+1]});
 wsS.getRow(HS).height=44;
 wsS.getCell('A1').value='SOPRADORES DO PROJETO';wsS.getCell('A1').font={bold:true,size:14};
 wsS.getCell('A2').value='Preencha as colunas sem cor (A a I). As colunas em azul claro são fórmulas: não edite. Soprador e bico vêm das abas Cat. sopradores e Bicos sopradores.';
 wsS.getCell('A3').value='CONSUMO TOTAL – SOPRADORES (l/min)';wsS.getCell('A3').font={bold:true};
 let totS=0,valvS=0;
 for(let r=PS;r<=US;r++){
  const s=estado.sopros[r-PS],res0=s?calcSopro(s):null,res=res0&&res0.sop?res0:null; // soprador do projeto (ou linha reserva vazia) e o cálculo dele; sem soprador escolhido, as fórmulas ficam vazias
  const li=s?estado.linhas.findIndex(x=>x.uid===s.linha):-1,l=li>=0?estado.linhas[li]:null,bo=s?estado.bicos.find(x=>x.id===s.bico):null;
  const soLinha=l&&l.sopro&&!l.cil; // linha de soprador sem cilindro: a válvula dela conta aqui
  const val=soLinha?estado.valvulas.find(x=>x.id===l.val):null;
  const ent=(col,v)=>{const c=wsS.getCell(col+r);c.value=v;c.border=BORDA_X}; // célula de entrada
  const fx=(col,formula,result,fmt)=>{const c=wsS.getCell(col+r);c.value={formula,result:result??''};c.border=BORDA_X;c.fill=FILL_CALC;if(fmt)c.numFmt=fmt}; // célula com fórmula
  ent('A',s?(s.nome||null):null);ent('B',l?('Linha '+(li+1)+(l.tag?' · '+l.tag:'')+(l.descFuncao?' · '+l.descFuncao:'')):null);ent('C',res&&res.sop?rotSop(res.sop):null);ent('D',bo?rotBico(bo):null);
  ent('E',s?numX(s.qtd):null);ent('F',s?numX(s.pressao):null);ent('G',s?numX(s.tempo):null);ent('H',val?rotVal(val):null);ent('I',val?numX(l.qtdVal):null);
  wsS.getCell('C'+r).dataValidation={type:'list',allowBlank:true,formulae:[CSr('A')]};wsS.getCell('D'+r).dataValidation={type:'list',allowBlank:true,formulae:[PDr('A')]};wsS.getCell('H'+r).dataValidation={type:'list',allowBlank:true,formulae:["'Válvulas'!$A$2:$A$"+FIM_CAT]};
  const G=`$C${r}=""`,ach=`MATCH($C${r},${CSr('A')},0)`; // G = "sem soprador escolhido": fórmulas ficam vazias
  fx('J',`IF(${G},"",IF($D${r}<>"",$D${r},IFERROR(INDEX(${CSr('C')},${ach})&"","")))`,res&&(res.bico?rotBico(res.bico):''));
  fx('K',`IF(${G},"",IF(J${r}<>"",IFERROR(INDEX(${PDr('D')},MATCH(J${r},${PDr('A')},0)),0),IFERROR(INDEX(${CSr('D')},${ach}),0)))`,res&&res.nf,'0.##');
  fx('L',`IF(${G},"",IF(J${r}<>"",IFERROR(INDEX(${PDr('E')},MATCH(J${r},${PDr('A')},0)),0),IFERROR(INDEX(${CSr('E')},${ach}),0)))`,res&&res.d,'0.##');
  fx('M',`IF(${G},"",IF(N($F${r})>0,$F${r},IF(IFERROR(N(INDEX(${CSr('G')},${ach})),0)>0,INDEX(${CSr('G')},${ach}),'Parâmetros'!$B$2)))`,res&&res.P,'0.##');
  fx('N',`IF(${G},"",IF(N($G${r})>0,$G${r},IF(IFERROR(N(INDEX(${CSr('H')},${ach})),0)>0,INDEX(${CSr('H')},${ach}),0)))`,res&&res.t,'0.##');
  fx('O',`IF(${G},"",K${r}*PI()*L${r}^2/4)`,res&&res.area,'#,##0.00');
  fx('P',`IF(${G},"",10.2*O${r}*(M${r}+1.013))`,res&&res.vazEst,'#,##0.00');
  fx('Q',`IF(${G},"",IFERROR(N(INDEX(${CSr('F')},${ach})),0))`,res&&res.vazInf,'#,##0.00');
  fx('R',`IF(${G},"",IF(Q${r}>0,Q${r},P${r}))`,res&&res.vazao,'#,##0.00');
  fx('S',`IF(${G},"",R${r}*N${r}/60)`,res&&res.porSopro,'#,##0.00');
  fx('T',`IF(${G},"",S${r}*N($E${r}))`,res&&res.total,'#,##0.00');
  if(res)totS+=res.total;if(val)valvS+=num(l.qtdVal); // válvula só conta se foi escolhida
 }
 wsS.getCell('B3').value={formula:`SUM(T${PS}:T${US})`,result:totS};wsS.getCell('B3').numFmt='#,##0.00';wsS.getCell('B3').font={bold:true};
 wsS.views=[{state:'frozen',ySplit:HS}]; // título fixo ao rolar
 const totCil=total; // consumo das válvulas/cilindros (calculado no laço acima)
 ws.getCell('A3').value='CONSUMO TOTAL – VÁLVULAS/CILINDROS (l/min)';ws.getCell('A3').font={bold:true};ws.getCell('B3').value={formula:`SUM(N${PRIM}:N${ULT})`,result:totCil};ws.getCell('B3').numFmt='#,##0.00';ws.getCell('B3').font={bold:true};
 ws.getCell('A4').value='CONSUMO TOTAL – SOPRADORES (l/min)';ws.getCell('A4').font={bold:true};ws.getCell('B4').value={formula:"'Sopradores'!$B$3",result:totS};ws.getCell('B4').numFmt='#,##0.00';ws.getCell('B4').font={bold:true};
 ws.getCell('A5').value='CONSUMO TOTAL DO PROJETO (l/min)';ws.getCell('A5').font={bold:true};ws.getCell('B5').value={formula:'B3+B4',result:totCil+totS};ws.getCell('B5').numFmt='#,##0.00';ws.getCell('B5').font={bold:true};
 ws.getCell('A6').value='Qtd. total de cilindros';ws.getCell('A6').font={bold:true};ws.getCell('B6').value={formula:`SUMIF(A${PRIM}:A${ULT},"<>",G${PRIM}:G${ULT})`,result:qCil};
 ws.getCell('D6').value='Qtd. total de válvulas';ws.getCell('D6').font={bold:true};ws.getCell('E6').value={formula:`SUMIF(A${PRIM}:A${ULT},"<>",E${PRIM}:E${ULT})+SUM('Sopradores'!I${PS}:I${US})`,result:qVal+valvS};
 ws.views=[{state:'frozen',xSplit:1,ySplit:HR}]; // título e 1ª coluna fixos ao rolar
 const geralPV=totalGeralPV();cabX(wsResumo.getCell('A1'),'RESUMO DE PAINEIS');cabX(wsResumo.getCell('A2'),'Painel');cabX(wsResumo.getCell('B2'),'Consumo total (l/min)');
 wsDetalhe.getRow(1).values=['Painel','Tipo','Conjunto / TAG','Identificação','Válvula','Mangueira','Qtd.','Pressão (bar)','Tempo (s/min)','Resumo dos furos','Capacidade item (l/min)','Vazão mangueira aberta ao ar (l/min)','Vazão aplicada (l/min)','Consumo por item (l/min)','Consumo total (l/min)','Observação / validação'];let rp=3;gravarPainelAtivo();for(const p of estado.paineis){const old={linhas:estado.linhas,sopros:estado.sopros,params:estado.params,filtroSel:estado.filtroSel};Object.assign(estado,{linhas:p.linhas||[],sopros:p.sopros||[],params:p.params||{pressao:6,taxa:1,margem:1.1},filtroSel:p.filtroSel||filtroSelPadrao()});const t=totaisProjeto();wsResumo.getCell(rp,1).value=p.nome;wsResumo.getCell(rp,2).value=t.geral;(p.linhas||[]).forEach(l=>{const r=calc(l);if(r)wsDetalhe.addRow([p.nome,'Cilindro',l.tag||'',l.descFuncao||r.c.nome,r.v?.modelo||'',r.man?.nome||'',r.q,r.P,'','', '', '', '',r.cons,r.cons,l.obs||''])});(p.sopros||[]).forEach((sp,i)=>{const r=calcSopro(sp);wsDetalhe.addRow([p.nome,r.sop?.tipo||'Sopro/vácuo',sp.linha?(p.linhas||[]).find(l=>l.uid===sp.linha)?.tag||'':'',sp.nome||r.sop?.nome||('Item '+(i+1)),r.val?.modelo||'',r.mang?.nome||'',r.q,r.P,r.t,textoFuros(r.nf,r.d),r.vazInf>0?r.vazInf:r.vazEst,r.vazaoMangueiraAberta,r.vazao,r.porSopro,r.total,[sp.obs,r.alerta].filter(Boolean).join(' | ')])});rp++;Object.assign(estado,old)}wsResumo.getCell(rp+1,1).value='TOTAL GERAL DA PV';wsResumo.getCell(rp+1,2).value=geralPV;wsDetalhe.views=[{state:'frozen',ySplit:1}];[18,18,24,30,22,22,10,14,14,24,20,22,20,22,22,42].forEach((w,i)=>wsDetalhe.getColumn(i+1).width=w);[16,24].forEach((w,i)=>wsResumo.getColumn(i+1).width=w);
 const pa=estado.paineis.find(x=>x.id===estado.painelAtivoId);wsResumo.getCell('D1').value='Painel ativo: '+(pa?.nome||'-');
 const heads=['Identificação','Conjunto / TAG','Item','Válvula','Mangueira','Qtd.','Pressão (bar)','Tempo (s/min)','Furos','Capacidade item (l/min)','Vazão mangueira aberta ao ar (l/min)','Vazão aplicada (l/min)','Consumo por item (l/min)','Consumo total (l/min)','Observação'];heads.forEach((h,i)=>cabX(wactive.getCell(1,i+1),h));let ra=2;(pa?.sopros||[]).forEach((sp,i)=>{const r=calcSopro(sp),li=(pa.linhas||[]).find(l=>l.uid===sp.linha);wactive.addRow([sp.nome||r.sop?.nome||('Item '+(i+1)),li?('Linha '+((pa.linhas||[]).indexOf(li)+1)+' '+(li.tag||'')):'',r.sop?rotSop(r.sop):'',r.val?.modelo||'',r.mang?.nome||'',r.q,r.P,r.t,textoFuros(r.nf,r.d),r.vazInf>0?r.vazInf:r.vazEst,r.vazaoMangueiraAberta,r.vazao,r.porSopro,r.total,[sp.obs,r.alerta].filter(Boolean).join(' | ')]);ra++});wactive.getColumn(1).width=28;[30,42,24,24,10,14,14,22,20,22,20,22,22,40].forEach((w,i)=>wactive.getColumn(i+2).width=w);return baixarXlsx(wb,nomeXlsx('conjuntos_pneumatico'));
}
function gerarExcelMateriais(){
 if(!bibliotecaExcel())return;
 const itens=listaMateriais(),pai=String(estado.codPai||'').trim()||'-'; // peças totalizadas e código pai (vazio vira "-")
 const wb=new ExcelJS.Workbook(),ws=wb.addWorksheet('Lista de materiais');
 ws.getCell('A1').value='DELTA EQUIPAMENTOS LTDA';ws.getCell('A1').font={bold:true,size:14};
 [['Projeto:',estado.desenho],['Pedido de Venda:',estado.pv],['Cliente:',estado.cliente]].forEach(([t,v],i)=>{ws.getCell(i+2,1).value=t;ws.getCell(i+2,1).font={bold:true};ws.getCell(i+2,2).value=v||'-'}); // projeto = nº do desenho
 ws.getCell('A6').value='Lista de Peças Totalizadas para Integração com ERP';ws.getCell('A6').font={bold:true};
 ['COD PAI','COD FILHO','Descrição','Qtde.','Comprimento'].forEach((t,i)=>cabX(ws.getCell(8,i+1),t));
 const linhas=itens.length?itens.map(i=>[pai,i.erp||'SEM CÓD. ERP',i.desc||'-',i.qtd,i.temComp?i.comp:'-']):[['-','-','-','-','-']]; // sem peças: linha de "-" como no modelo
 linhas.forEach((lin,k)=>lin.forEach((v,i)=>{const c=ws.getCell(9+k,i+1);c.value=v;c.border=BORDA_X;if(i>=3)c.alignment={horizontal:'right'};if(i===4&&typeof v==='number')c.numFmt='#,##0.00" m"'})); // comprimento em metros
 [16,18,56,10,16].forEach((w,i)=>ws.getColumn(i+1).width=w);
 return baixarXlsx(wb,nomeXlsx('lista_materiais'));
}
$('excelConjuntos').onclick=gerarExcelConjuntos;$('excelMateriais').onclick=gerarExcelMateriais;
/* ===== SOPRADORES E BICOS SOPRADORES ===== */
const K_SOPRO=10.2,PATM_SOPRO=1.013,PRESSAO_REFERENCIA_MANGUEIRA=6; // vazão de catálogo da mangueira referenciada a 6 bar; vazão estimada: Q = 10,2 × área (mm²) × pressão absoluta
function novoUid(){return 'L'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)} // identificador único de cada linha do conjunto
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); // protege o texto que vai para o HTML
const fmtL=x=>num(x).toLocaleString('pt-BR',{maximumFractionDigits:2}); // número sem zeros sobrando (ex.: 2 e não 2,00)
const rotBico=b=>[b.erp,b.erpdesc,b.modelo].filter(Boolean).join(' | ')||'(sem nome)'; // texto do bico nas listas
const rotSop=s=>[s.tipo,s.nome,s.modelo,s.erp].filter(Boolean).join(' | ')||'(sem nome)'; // texto do soprador nas listas
function areaFuros(n,d){const quantidade=num(n),diametro=num(d);return quantidade>0&&diametro>0?quantidade*Math.PI*diametro**2/4:0} // área total dos furos (mm²) = nº de furos × π × d² ÷ 4
function textoFuros(n,d){n=num(n);return n>0&&num(d)>0?n+(n===1?' furo':' furos')+' de '+fmtL(d)+' mm':'-'} // ex.: "2 furos de 2 mm"
function novoSopro(uid){return {id:'sp'+Date.now()+Math.random().toString(36).slice(2,5),linha:uid,nome:'',sop:'',bico:'',val:'',mang:'',qtd:1,pressao:'',tempo:'',obs:''}} // linha nova da tabela de sopradores do projeto

/* ---- cálculo de um soprador do projeto ---- */
/* MODEL — cálculo e regras de negócio dos sopradores. */
function calcSopro(s){
 const sop=estado.sopradores.find(x=>x.id===s.sop)||estado.sopradores.find(x=>x.id===s.bico)||null;
 const mang=estado.mangueiras.find(x=>x.id===s.mang)||null,val=estado.valvulas.find(x=>x.id===(s.val||estado.linhas.find(l=>l.uid===s.linha)?.val))||null;
 const areaMang=areaFuros(1,mang?.diamInterno),mangueiraLivre=!sop&&!!mang&&areaMang>0;
 if(!sop&&!mangueiraLivre)return {sop:null,bico:null,mang,val,nf:0,d:0,P:0,t:0,q:num(s.qtd),area:0,areaMang,vazEst:0,vazInf:0,vazao:0,porSopro:0,total:0,informada:false,limiteMangueira:0,alerta:mang?'Informe o diâmetro interno da mangueira':'Selecione um item ou uma mangueira'};
 const bico=estado.bicos.find(x=>x.id===(s.bico||sop?.bico))||((sop?.tipo||'').toLowerCase().includes('bico')?sop:null);
 const nf=mangueiraLivre?1:num(sop?.nfuros)||num(bico?.nfuros),d=mangueiraLivre?num(mang.diamInterno):num(sop?.dfuro)||num(bico?.dfuro),Psolicitada=num(s.pressao)||num(estado.params.pressao),Pmax=num(sop?.pressaoMax),P=Pmax>0?Math.min(Psolicitada,Pmax):Psolicitada,tempoInformado=s.tempo!==''&&s.tempo!=null,tSolicitado=tempoInformado?num(s.tempo):num(sop?.tempo)||(mangueiraLivre?60:0),t=Math.min(60,Math.max(0,tSolicitado)),q=num(s.qtd);
 const area=mangueiraLivre?areaMang:areaFuros(nf,d),vazEst=K_SOPRO*area*(P+PATM_SOPRO),vazInf=num(sop?.vazao),vazBase=vazInf>0?Math.min(vazInf,vazEst):vazEst;
 const vazaoMangueiraAberta=areaMang>0?K_SOPRO*areaMang*(P+PATM_SOPRO):0,capacidadeMangueiraPressao=num(mang?.vazao)>0?num(mang.vazao)*(P+PATM_SOPRO)/(PRESSAO_REFERENCIA_MANGUEIRA+PATM_SOPRO):0,limites=[capacidadeMangueiraPressao,vazaoMangueiraAberta].filter(x=>x>0),limiteMangueira=limites.length?Math.min(...limites):0;
 const vazao=vazBase,demandaInstantanea=vazao*q,consumoTeorico=demandaInstantanea*t/60,total=limiteMangueira>0?Math.min(consumoTeorico,limiteMangueira):consumoTeorico,porSopro=q>0?total/q:0,demandaAplicada=total,excedePorItem=limiteMangueira>0&&vazao>limiteMangueira,excedeMangueira=limiteMangueira>0&&demandaInstantanea>limiteMangueira;
 const alertas=[];if(Pmax>0&&Psolicitada>Pmax)alertas.push('Pressão ajustada ao máximo permitido do item');if(vazInf>0&&vazEst>vazInf)alertas.push('Vazão limitada pela capacidade cadastrada');if(mang&&!num(mang.diamInterno))alertas.push('Diâmetro interno da mangueira não informado');if(!mang)alertas.push('Selecione a mangueira de alimentação');else if(excedeMangueira)alertas.push('Demanda de '+fmt(demandaInstantanea)+' L/min excede o limite da mangueira ('+fmt(limiteMangueira)+' L/min)');const alerta=alertas.join('; ');
 return {sop,bico,mang,val,nf,d,P,Psolicitada,Pmax,t,q,area,areaMang,vazEst,vazInf,vazao,demandaInstantanea,demandaAplicada,porSopro,total,informada:vazInf>0,limiteMangueira,vazaoMangueiraAberta,excedePorItem,excedeMangueira,mangueiraLivre,alerta};
}
function totaisProjeto(){ // consumo das válvulas/cilindros, dos sopradores e o total do projeto
 let cil=0;estado.linhas.forEach(l=>{const r=calc(l);if(r)cil+=r.cons});
 const sop=estado.sopros.reduce((a,s)=>a+calcSopro(s).total,0);
 return {cil,sop,geral:cil+sop};
}
function qtdValvulasProjeto(){const cilindros=estado.linhas.reduce((a,l)=>a+(calc(l)?num(l.qtdVal):0),0);const valSopros=estado.sopros.reduce((a,s)=>a+(s.val||estado.linhas.find(l=>l.uid===s.linha)?.val?num(s.qtd):0),0);return cilindros+valSopros}
/* ---- ícone da linha (tabela de conjuntos) ---- */
function botaoSopro(l){ // botão 💨: liga/desliga o soprador na linha
 const b=document.createElement('button');b.type='button';b.className='sopbtn'+(l.sopro?' on':'');b.textContent='💨';
 b.title=l.sopro?'Esta linha usa soprador (clique para desativar)':'Clique para indicar que esta linha usa soprador';
 b.onclick=()=>alternarSopro(l);return b;
}
function alternarSopro(l){
 if(!l.sopro){ // ativar: marca a linha e cria o soprador ligado a ela
  l.sopro=true;if(!estado.sopros.some(s=>s.linha===l.uid))estado.sopros.push(novoSopro(l.uid));
 }else{ // desativar: remove o soprador ligado (pergunta só se ele já tem dados)
  if(estado.sopros.some(s=>s.linha===l.uid&&s.sop)&&!confirm('Remover o soprador ligado a esta linha?'))return;
  estado.sopros=estado.sopros.filter(s=>s.linha!==l.uid);l.sopro=false;
 }
 salvar();renderProject();
}
$('add').onclick=()=>{estado.linhas.push({cil:'',val:'',descFuncao:'',qtdVal:1,obs:'',tag:'',qtd:1,acion:1,tempo:1,dist:10,mang:'',uid:novoUid(),sopro:false});salvar();renderProject()}; // conjunto novo (agora com identificador)
$('addSop').onclick=()=>{ // cria uma linha de conjunto já marcada como soprador + o soprador ligado a ela
 const l={cil:'',val:'',descFuncao:'',qtdVal:1,obs:'',tag:'',qtd:1,acion:1,tempo:1,dist:10,mang:'',uid:novoUid(),sopro:true};
 estado.linhas.push(l);estado.sopros.push(novoSopro(l.uid));salvar();renderProject();
};

/* ---- tabela de sopradores do projeto (separada da tabela de conjuntos) ---- */
/* VIEW — desenha cartões e resultados dos sopradores. */
function renderSopros(){
 $('cabSop').innerHTML='<tr>'+['Identificação','Conjunto / Linha / TAG','Item do catálogo (vazio = mangueira aberta)','Válvula','Mangueira de alimentação','Diâmetro interno da mangueira (mm)','Capacidade calculada pelo diâmetro (L/min)','Quantidade','Pressão bar','Tempo s/min','Resumo dos furos','Capacidade máxima do item (L/min)','Limite efetivo da mangueira (L/min)','Vazão por item (L/min)','Demanda simultânea total (L/min)','Consumo por item (L/min)','Consumo total (L/min)','Observação'].map(x=>'<th>'+x+'</th>').join('')+'<th></th></tr>';
 const tb=$('corpoSop');tb.innerHTML='';
 estado.sopros.forEach((s,i)=>{const tr=document.createElement('tr'),cel=e=>{const td=document.createElement('td');td.append(e);tr.append(td)},calcTd=()=>{const td=document.createElement('td');td.className='calc';tr.append(td)},inp=(k,ph)=>{const x=document.createElement('input');if(k==='tempo'){x.type='number';x.min='0';x.max='60';x.step='any';if(num(s[k])>60)s[k]=60}x.value=s[k]??'';x.placeholder=ph||'';x.oninput=()=>{s[k]=x.value;salvar();atualizarSopros()};if(k==='tempo')x.onchange=()=>{s[k]=String(x.value).trim()===''?'':String(Math.min(60,Math.max(0,num(x.value))));x.value=s[k];salvar();atualizarSopros()};return x},sel=(k,lista,rot,vazio,onChange)=>{const x=document.createElement('select');x.innerHTML='<option value="">'+esc(vazio)+'</option>';lista.forEach(o=>{const z=document.createElement('option');z.value=o.id;z.textContent=rot(o);x.append(z)});x.value=s[k]||'';x.onchange=()=>{s[k]=x.value;if(onChange)onChange();salvar();renderSopros()};return x};
  const linha=estado.linhas.find(l=>l.uid===s.linha);if(!s.val&&linha?.val)s.val=linha.val;cel(inp('nome','Ex.: soprador da estação 7'));calcTd();cel(sel('sop',estado.sopradores,rotSop,'Selecione item',()=>{s.bico='';const item=estado.sopradores.find(x=>x.id===s.sop);if(item&&!s.nome)s.nome=item.nome||item.erpdesc||''}));cel(sel('val',estado.valvulas,v=>v.modelo+' ('+v.vias+')','Selecione válvula'));cel(sel('mang',estado.mangueiras,m=>m.nome+' — Ø int. '+fmtL(m.diamInterno)+' mm','Selecione mangueira'));calcTd();calcTd();cel(inp('qtd','1'));cel(inp('pressao','Padrão do painel'));cel(inp('tempo',!s.sop&&s.mang?'60 (fluxo contínuo)':'s/min'));calcTd();calcTd();calcTd();calcTd();calcTd();calcTd();calcTd();cel(inp('obs','Observação da montagem'));
  const td=document.createElement('td'),b=document.createElement('button');b.textContent='×';b.className='del';b.onclick=()=>{if(linha)linha.sopro=false;estado.sopros.splice(i,1);salvar();renderProject()};td.append(b);tr.append(td);tb.append(tr)
 });atualizarSopros()
}
function linhasBloco(s,r){return [
 ['Tipo do item',r.mangueiraLivre?'Mangueira aberta':r.sop?.tipo||'-'],['Item cadastrado',r.sop?rotSop(r.sop):r.mangueiraLivre?r.mang.nome+' (saída aberta)':'-'],['Válvula de acionamento',r.val?.modelo||'-'],['Mangueira alimentadora',r.mang?r.mang.nome+' (Ø interno '+fmtL(r.mang.diamInterno)+' mm)':'-'],['Resumo dos furos',textoFuros(r.nf,r.d)],['Pressão usada',fmtL(r.P)+' bar'],['Pressão máxima do item',num(r.sop?.pressaoMax)>0?fmtL(r.sop.pressaoMax)+' bar':'não informada'],['Capacidade máxima cadastrada',fmt(r.vazInf||r.vazEst)+' L/min'],['Área interna da mangueira',r.areaMang>0?fmt(r.areaMang)+' mm²':'não informada'],['Vazão da mangueira aberta ao ar',r.vazaoMangueiraAberta>0?fmt(r.vazaoMangueiraAberta)+' L/min':'não calculada'],['Limite da mangueira',r.limiteMangueira>0?fmt(r.limiteMangueira)+' L/min':'não informado'],['Vazão aplicada',fmt(r.vazao)+' L/min'],['Tempo acionado',fmtL(r.t)+' s/min'],['Quantidade',fmtL(r.q)],['Consumo por item',fmt(r.porSopro)+' L/min'],['Consumo total',fmt(r.total)+' L/min'],['Validação',r.alerta||'Dentro dos limites']
]}
function atualizarSopros(){
 const tb=$('corpoSop');if(tb.rows.length===estado.sopros.length){[...tb.rows].forEach((tr,i)=>{const s=estado.sopros[i],r=calcSopro(s),c=tr.cells,li=estado.linhas.findIndex(l=>l.uid===s.linha),l=li>=0?estado.linhas[li]:null;
  c[1].textContent=l?'Linha '+(li+1)+(l.tag?' · '+l.tag:'')+(l.descFuncao?' · '+l.descFuncao:''):'-';c[5].textContent=r.mang&&num(r.mang.diamInterno)>0?fmtL(r.mang.diamInterno):'-';c[6].textContent=r.vazaoMangueiraAberta>0?fmt(r.vazaoMangueiraAberta):'-';c[10].textContent=textoFuros(r.nf,r.d);c[11].textContent=r.vazInf>0?fmt(r.vazInf):fmt(r.vazEst);c[12].textContent=r.limiteMangueira>0?fmt(r.limiteMangueira):'-';c[13].textContent=fmt(r.vazao);c[14].textContent=fmt(r.demandaInstantanea);c[15].textContent=fmt(r.porSopro);c[16].textContent=fmt(r.total);c[12].classList.toggle('aviso',r.excedeMangueira);c[13].classList.toggle('aviso',r.excedePorItem);c[14].classList.toggle('aviso',r.excedeMangueira);c[16].classList.toggle('aviso',r.excedeMangueira);if(r.alerta){c[12].title=r.alerta;c[13].title=r.alerta;c[14].title=r.alerta;c[16].title=r.alerta}else{c[12].removeAttribute('title');c[13].removeAttribute('title');c[14].removeAttribute('title');c[16].removeAttribute('title')}
  c[2].firstElementChild.classList.toggle('falta',!s.sop&&!r.mangueiraLivre);c[3].firstElementChild.classList.toggle('falta',!s.val&&!l?.val);c[4].firstElementChild.classList.toggle('falta',!s.mang);c[7].firstElementChild.classList.toggle('falta',num(s.qtd)<=0);c[9].firstElementChild.classList.toggle('falta',!s.tempo&&!r.sop?.tempo&&!r.mangueiraLivre)
 })}
 const t=totaisProjeto();$('totCil').textContent=fmt(t.cil);$('totSop').textContent=fmt(t.sop);$('totGeral').textContent=fmt(t.geral);
 $('blocosSop').innerHTML=estado.sopros.map((s,i)=>{const r=calcSopro(s);return '<div class="mem"><h3>'+esc((s.nome||r.sop?.nome||(r.mangueiraLivre?'Mangueira aberta - '+r.mang.nome:'Soprador '+(i+1))).toUpperCase())+'</h3><div class="rolagem"><table><thead><tr><th>Parâmetro</th><th>Valor</th></tr></thead><tbody>'+linhasBloco(s,r).map(x=>'<tr><td>'+esc(x[0])+'</td><td>'+esc(x[1])+'</td></tr>').join('')+'</tbody></table></div></div>'}).join('');renderFiltros()
}
function migrarCatalogoSopro(){const ids=new Set(estado.sopradores.map(x=>x.id)),erps=new Set(estado.sopradores.map(x=>String(x.erp||'').trim()).filter(Boolean));estado.bicos.forEach(b=>{if(!ids.has(b.id)){estado.sopradores.push({...b,tipo:'Bico soprador',nome:b.nome||b.modelo||b.erpdesc||'',pressaoMax:b.pressaoMax||'',vazao:b.vazao||''});ids.add(b.id);if(b.erp)erps.add(String(b.erp).trim())}});sopradoresBase.forEach(base=>{if(!erps.has(base.erp)){let item=clone(base);while(ids.has(item.id))item.id+='-base';estado.sopradores.push(item);ids.add(item.id);erps.add(base.erp)}});estado.sopradores.forEach(s=>{s.tipo=s.tipo||'Haste com furos';s.nome=s.nome||s.erpdesc||s.modelo||'';s.pressaoMax=s.pressaoMax??'';s.vazao=s.vazao??''});estado.mangueiras.forEach(m=>{m.diamInterno=m.diamInterno??'';m.areaInterna=areaFuros(1,m.diamInterno)});try{PneumoStorage.setItem(CATALOGS_KEY,JSON.stringify(catalogosEstado()))}catch(e){console.error('Falha ao migrar o catálogo de sopro.',e)}}/* ---- catálogos: bicos sopradores e sopradores ---- */
function migrarCatalogoFiltros(){const ids=new Set(estado.filtros.map(x=>x.id));filtrosBase.forEach(base=>{const existente=estado.filtros.find(x=>String(x.erp||'').trim()===base.erp);if(existente){Object.assign(existente,clone(base),{id:existente.id})}else{let item=clone(base);while(ids.has(item.id))item.id+='-base';estado.filtros.push(item);ids.add(item.id)}});try{PneumoStorage.setItem(CATALOGS_KEY,JSON.stringify(catalogosEstado()))}catch(e){console.error('Falha ao migrar o catálogo de filtros.',e)}}
function camposCat(idh,idb,arr,cols,aoMudar){ // tabela de catálogo. cols = [chave,título,tipo,extra]; tipo: (vazio)=texto | 'sel'=lista fixa | 'dyn'=lista de cadastros | 'calc'=só leitura
 $(idh).innerHTML='<tr>'+cols.map(c=>'<th>'+c[1]+'</th>').join('')+'<th></th></tr>';
 const tb=$(idb);tb.innerHTML='';
 arr.forEach((o,i)=>{
  const tr=document.createElement('tr'),calcs=[];
  const refrescar=()=>calcs.forEach(([td,fn])=>td.textContent=fn(o)); // recalcula as colunas calculadas desta linha
  cols.forEach(([k,titulo,tipo,extra])=>{
   const td=document.createElement('td');let x;
   if(tipo==='calc'){td.className='calc';td.textContent=extra(o);calcs.push([td,extra]);tr.append(td);return}
   if(tipo==='sel'||tipo==='dyn'){
    x=document.createElement('select');
    const ops=tipo==='sel'?extra.map(v=>[v,v]):[['',extra.vazio]].concat(extra.lista().map(z=>[z.id,extra.rot(z)]));
    ops.forEach(([v,t])=>{const z=document.createElement('option');z.value=v;z.textContent=t;x.append(z)});
    if(tipo==='sel'&&!o[k])o[k]=extra[0]; // valor padrão da lista
    x.value=o[k]||'';x.onchange=()=>{o[k]=x.value;refrescar();salvar();aoMudar()};
   }else{x=document.createElement('input');x.value=o[k]??'';x.oninput=()=>{o[k]=x.value;refrescar();salvar();aoMudar()}}
   td.append(x);tr.append(td);
  });
  const td=document.createElement('td'),b=document.createElement('button');b.textContent='×';b.className='del';b.onclick=()=>{arr.splice(i,1);salvar();renderAll()};td.append(b);tr.append(td);tb.append(tr);
 });
}
const fbico=[];
const fsop=[['tipo','Tipo do item','sel',['Bico soprador','Haste com furos','Gerador de vácuo']],['nome','Nome / descrição'],['modelo','Modelo'],['erp','Código ERP'],['erpdesc','Descrição do código ERP'],['nfuros','Quantidade de furos'],['dfuro','Diâmetro dos furos (mm)'],['pressaoMax','Pressão máxima (bar)'],['vazao','Capacidade máxima (L/min)'],['obs','Observações']];
function renderCatBico(){}
function renderCatSop(){camposCat('cabSopCat','corpoSopCat',estado.sopradores,fsop,()=>renderSopros())}
$('addSopCat').onclick=()=>{estado.sopradores.push({id:'s'+Date.now(),tipo:'Bico soprador',nome:'',modelo:'',nfuros:'',dfuro:'',vazao:'',pressaoMax:'',erp:'',erpdesc:'',obs:''});salvar();renderAll()};
/* ===== FILTROS DE AR ===== */
const TIPOS_FILTRO=[['cond','Separador de condensado'],['reg','Filtro regulador'],['pres','Pressostato']]; // [chave interna, nome do tipo no catálogo]
function filtroSelPadrao(){ // respostas iniciais das perguntas (projeto novo)
 const q=()=>({usar:'Não',modo:'Automático',manual:''}); // usar = precisa deste filtro? | modo = automático ou manual | manual = filtro escolhido à mão
 return {rosca:'',dreno:'Automático',cond:q(),reg:q(),pres:q()};
}
/* ---- catálogo de filtros de ar (tabela de cadastro) ---- */
const ffil=[['tipo','Tipo','sel',['Separador de condensado','Filtro regulador','Pressostato']],['nome','Nome'],['erp','Código ERP'],['erpdesc','Descrição ERP'],['rosca','Encaixe (rosca/conexão)'],['largura','Largura (mm)'],['altura','Altura (mm)'],['profund','Profundidade (mm)'],['vazao','Capacidade de vazão (l/min)'],['pressaoMax','Pressão máxima (bar)'],['faixaReg','Faixa de regulagem (bar)'],['filtragem','Grau de filtragem (µm)'],['dreno','Dreno','sel',['Automático','Manual','Não se aplica']],['obs','Observação']]; // colunas do cadastro
function renderCatFiltros(){camposCat('cabFiltro','corpoFiltro',estado.filtros,ffil,()=>renderFiltros())} // mexeu no catálogo: atualiza a sugestão
$('addFiltro').onclick=()=>{estado.filtros.push({id:'f'+Date.now(),tipo:'Separador de condensado',nome:'',erp:'',erpdesc:'',rosca:'',largura:'',altura:'',profund:'',vazao:'',pressaoMax:'',faixaReg:'',filtragem:'',dreno:'Não se aplica',obs:''});salvar();renderAll()}; // novo filtro em branco
/* ---- escolha do filtro (automática ou manual) ---- */
function escolherFiltro(chave,nomeTipo,demanda){ // devolve {f: filtro escolhido ou null, status: texto}
 const sel=estado.filtroSel,q=sel[chave],P=num(estado.params.pressao);
 let lista=estado.filtros.filter(f=>f.tipo===nomeTipo); // só filtros do tipo
 let f=null;
 if(q.modo==='Manual'){ // manual: o usuário escolheu na lista
  f=lista.find(x=>x.id===q.manual)||null;
  if(!f)return {f:null,status:'Escolha o filtro na lista'};
 }else{ // automático: aplica as respostas como filtros e pega o de menor capacidade que atende
  if(sel.rosca)lista=lista.filter(x=>(x.rosca||'')===sel.rosca); // encaixe escolhido
  if(chave==='reg')lista=lista.filter(x=>(x.dreno||'')===sel.dreno); // dreno automático ou manual (só no filtro regulador)
  lista=lista.filter(x=>!num(x.pressaoMax)||num(x.pressaoMax)>=P); // pressão máxima precisa suportar a pressão do projeto (em branco = não confere)
  if(chave!=='pres')lista=lista.filter(x=>num(x.vazao)>=demanda); // capacidade precisa atender o consumo (pressostato não tem vazão)
  lista.sort((a,b)=>num(a.vazao)-num(b.vazao)||num(a.pressaoMax)-num(b.pressaoMax)); // menor capacidade primeiro
  f=lista[0]||null;
  if(!f)return {f:null,status:'Nenhum filtro do catálogo atende (confira encaixe, dreno, pressão e capacidade)'};
 }
 let status='OK'; // confere o filtro escolhido (também no modo manual)
 if(chave!=='pres'&&num(f.vazao)<demanda)status='ATENÇÃO: capacidade menor que o consumo';
 else if(num(f.pressaoMax)>0&&num(f.pressaoMax)<P)status='ATENÇÃO: pressão máxima menor que a do projeto';
 return {f,status};
}
function filtrosSelecionados(){ // um item por tipo de filtro: {chave,nomeTipo,usar,modo,demanda,f,status}
 const demanda=totaisProjeto().geral; // consumo total do projeto (l/min), com sopradores
 return TIPOS_FILTRO.map(([chave,nomeTipo])=>{
  const q=estado.filtroSel[chave],usar=q.usar==='Sim';
  const r=usar?escolherFiltro(chave,nomeTipo,demanda):{f:null,status:'Não necessário'};
  return {chave,nomeTipo,usar,modo:q.modo,demanda,f:r.f,status:r.status};
 });
}
/* ---- tela: tabela de sugestão + perguntas no final ---- */
/* VIEW — apresenta a seleção e as recomendações de filtros. */
function renderFiltros(){
 if(!$('corpoFiltrosSug')||!estado.filtroSel)return; // página ainda não montada
 const sel=estado.filtroSel;
 // tabela com o resultado
 const tb=$('corpoFiltrosSug');tb.innerHTML='';
 filtrosSelecionados().forEach(x=>{
  const tr=document.createElement('tr');
  [x.nomeTipo,x.usar?x.modo:'-',x.f?.erp||'-',x.f?(x.f.erpdesc||x.f.nome||'-'):'-',x.f?.rosca||'-',x.f&&num(x.f.vazao)>0?fmt(x.f.vazao):'-',x.usar&&x.chave!=='pres'?fmt(x.demanda):'-',x.status].forEach(t=>{const td=document.createElement('td');td.textContent=t;tr.append(td)});
  if(x.usar&&!x.f||String(x.status).startsWith('ATENÇÃO'))tr.lastChild.className='aviso'; // destaca problemas
  tb.append(tr);
 });
 // perguntas
 const box=$('perguntasFiltros');box.innerHTML='';
 const perg=(rotulo,valor,ops,aoMudar)=>{ // cria uma pergunta (lista de escolha)
  const d=document.createElement('div'),l=document.createElement('label'),x=document.createElement('select');
  l.textContent=rotulo;ops.forEach(o=>{const z=document.createElement('option');z.value=Array.isArray(o)?o[0]:o;z.textContent=Array.isArray(o)?o[1]:o;x.append(z)});
  x.value=valor;x.onchange=()=>{aoMudar(x.value);salvar();renderFiltros()};d.append(l,x);box.append(d);
 };
 const roscas=[...new Set(estado.filtros.map(f=>(f.rosca||'').trim()).filter(Boolean))]; // encaixes que existem no catálogo
 perg('Precisa de separador de condensado?',sel.cond.usar,['Sim','Não'],v=>sel.cond.usar=v);
 perg('Precisa de filtro regulador?',sel.reg.usar,['Sim','Não'],v=>sel.reg.usar=v);
 if(sel.reg.usar==='Sim')perg('Dreno do filtro regulador',sel.dreno,['Automático','Manual'],v=>sel.dreno=v);
 perg('Precisa de pressostato?',sel.pres.usar,['Sim','Não'],v=>sel.pres.usar=v);
 perg('Encaixe (rosca) desejado',sel.rosca,[['','Qualquer'],...roscas],v=>sel.rosca=v);
 TIPOS_FILTRO.forEach(([chave,nomeTipo])=>{ // modo de escolha de cada tipo usado
  const q=sel[chave];if(q.usar!=='Sim')return;
  perg(nomeTipo+': escolha',q.modo,['Automático','Manual'],v=>q.modo=v);
  if(q.modo==='Manual')perg(nomeTipo+': filtro',q.manual,[['','Selecione o filtro'],...estado.filtros.filter(f=>f.tipo===nomeTipo).map(f=>[f.id,[f.erp,f.erpdesc,f.nome].filter(Boolean).join(' | ')||'(sem nome)'])],v=>q.manual=v);
 });
}

/* ===== CAMPOS ESSENCIAIS EM BRANCO FICAM AMARELOS ===== */
// coluna da tabela de conjuntos -> nome do campo (a coluna 0 é o ícone de soprador). Para deixar um campo opcional, é só apagar a linha dele.
// (Observações e Mangueira manual ficam de fora: são opcionais)
const ESSENCIAIS={1:'cil',2:'descFuncao',4:'val',5:'qtdVal',6:'tag',7:'qtd',8:'acion',9:'tempo',10:'dist'};
const SO_CILINDRO=['cil','qtd','acion','tempo','dist']; // campos que não valem para linha de soprador sem cilindro
function marcarFaltas(){
 [...$('corpoProj').rows].forEach((tr,i)=>{ // cada conjunto do projeto
  const l=estado.linhas[i];if(!l)return;
  const soSopro=l.sopro&&!l.cil; // linha de soprador sem cilindro: cilindro, qtd, acion., tempo e dist. não são obrigatórios
  Object.entries(ESSENCIAIS).forEach(([col,k])=>{
   const el=tr.cells[col]&&tr.cells[col].firstElementChild; // o campo (input ou lista) da célula
   if(el)el.classList.toggle('falta',String(l[k]??'').trim()===''&&!(soSopro&&SO_CILINDRO.includes(k)));
  });
 });
 ['pv','desenho','cliente','projetista','codPai'].forEach(k=>$(k).classList.toggle('falta',String(estado[k]??'').trim()==='')); // dados do projeto
}
/* MVC — ponto único de acesso às camadas para manutenção e futuras integrações. */
window.PneumoMVC=Object.freeze({
 model:Object.freeze({getState:()=>estado,calculate:calc,calculateBlower:calcSopro,snapshot}),
 view:Object.freeze({renderAll,renderProject,renderBlowers:renderSopros,renderFilters:renderFiltros}),
 controller:Object.freeze({saveProject,loadProject,createProject:criarNovo,autoSaveTick:autoTick}),
 persistence:PneumoStorage
});
/* CONTROLLER — carrega listas e monta a tela inicial após configurar as dependências. */
migrarProjetosSalvos();
migrarCatalogoSopro();
migrarCatalogoFiltros();
refreshProjects();refreshEmailFavorites();renderAll();
window.addEventListener('pneumo:shared-loaded',()=>{carregar();migrarProjetosSalvos();migrarCatalogoSopro();migrarCatalogoFiltros();['pv','desenho','cliente','projetista','codPai'].forEach(k=>$(k).value=estado[k]||'');$('p_pressao').value=estado.params.pressao;$('p_taxa').value=estado.params.taxa;$('p_margem').value=estado.params.margem;renderPainelSelect();refreshProjects();refreshEmailFavorites();renderAll();$('sharedSyncStatus').textContent='Banco compartilhado sincronizado.'});
window.addEventListener('pneumo:sync-ok',()=>{$('sharedSyncStatus').textContent='Banco compartilhado sincronizado.'});window.addEventListener('pneumo:sync-error',e=>{$('sharedSyncStatus').textContent='Falha na sincronização: '+(e.detail?.message||'verifique a conexão')});
if(PneumoStorage.hasSession())PneumoStorage.resume().then(ok=>{if(ok)$('loginGate').hidden=true;else $('loginErr').textContent='Sessão expirada ou sem conexão. Entre novamente.'});
// Gestao dos paineis da PV: os catalogos continuam no estado raiz e compartilhados.
renderPainelSelect();
$('painelSelect').onchange=()=>trocarPainel($('painelSelect').value);
$('addPainel').onclick=()=>{gravarPainelAtivo();const p=novoPainel('Painel '+(estado.paineis.length+1));estado.paineis.push(p);trocarPainel(p.id)};
$('renamePainel').onclick=()=>{const p=estado.paineis.find(x=>x.id===estado.painelAtivoId),nome=prompt('Nome do painel',p?.nome||'');if(nome&&nome.trim()){p.nome=nome.trim();salvar();renderPainelSelect()}};
$('removePainel').onclick=()=>{if(estado.paineis.length<=1){alert('A PV precisa manter pelo menos um painel.');return}if(!confirm('Remover o painel ativo e todos os seus dados?'))return;const i=estado.paineis.findIndex(x=>x.id===estado.painelAtivoId);estado.paineis.splice(i,1);const p=estado.paineis[Math.max(0,i-1)];trocarPainel(p.id)};
$('pv').value=estado.pv||'';$('desenho').value=estado.desenho||'';$('cliente').value=estado.cliente||'';$('projetista').value=estado.projetista||'';$('codPai').value=estado.codPai||'';$('p_pressao').value=estado.params.pressao;$('p_taxa').value=estado.params.taxa;$('p_margem').value=estado.params.margem;function removerPainelAtivo(){if(estado.paineis.length<=1){alert('A PV precisa manter pelo menos um painel.');return}if(!confirm('Remover o painel ativo e todos os seus dados?'))return;gravarPainelAtivo();const i=estado.paineis.findIndex(x=>x.id===estado.painelAtivoId);estado.paineis.splice(i,1);const p=estado.paineis[Math.max(0,i-1)];estado.painelAtivoId=p.id;Object.assign(estado,{linhas:clone(p.linhas),sopros:clone(p.sopros),params:clone(p.params),filtroSel:clone(p.filtroSel)});$('p_pressao').value=estado.params.pressao;$('p_taxa').value=estado.params.taxa;$('p_margem').value=estado.params.margem;salvar();renderPainelSelect();renderAll()}


$('removePainel').onclick=removerPainelAtivo;
document.addEventListener('keydown',e=>{if(!(e.ctrlKey||e.metaKey)||e.altKey)return;const foco=e.target?.closest?.('#corpoProj');if(e.key.toLowerCase()==='c'&&linhasSelecionadas.size&&foco){e.preventDefault();copiarLinhasSelecionadas()}else if(e.key.toLowerCase()==='v'&&clipboardPainel&&foco){e.preventDefault();colarLinhasCopiadas()}});
$('pasteLinhas').onclick=colarLinhasCopiadas;atualizarClipboardUI();
$('pdf').onclick=()=>baixarPdf(gerarPdfOrganizado(true));$('pdfActive').onclick=()=>baixarPdf(gerarPdfOrganizado(false));
