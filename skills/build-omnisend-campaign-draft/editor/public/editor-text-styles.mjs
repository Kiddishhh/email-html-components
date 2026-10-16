import {textFonts,textStyleLimits} from './text-style-contract.mjs';
const expanded=new Set();
const labels={fontFamily:'字体',fontSize:'字号（px）',fontWeight:'字重',color:'字体颜色',lineHeight:'行高（px）',letterSpacing:'字间距（px）',spaceBefore:'上方留白（px）',spaceAfter:'下方留白（px）',textAlign:'对齐'};
export function createTextStyleControl({instanceId,fieldKey,fieldLabel,metadata,getValue,onChange,settings}) {
  const details=document.createElement('details');details.className='text-style-control';details.dataset.textField=fieldKey;
  const token=`${instanceId}:${fieldKey}`;details.open=expanded.has(token);
  details.addEventListener('toggle',()=>{if(!details.isConnected)return;if(details.open)expanded.add(token);else expanded.delete(token);});
  const summary=document.createElement('summary');summary.textContent=Object.keys(getValue()).length?'文字样式 · 已自定义':'文字样式 · 组件默认';details.append(summary);
  const hint=document.createElement('small');hint.className='text-style-hint';hint.textContent='尺寸按 600px 桌面宽度填写，移动端按比例缩放。';details.append(hint);
  const grid=document.createElement('div');grid.className='text-style-grid';
  const defaults={...metadata.defaults};for(const [key,binding]of Object.entries(metadata.bindings??{}))defaults[key]=settings[binding]??defaults[key];
  if(defaults.fontFamily)defaults.fontFamily=defaults.fontFamily.split(',')[0].trim().replace(/&#39;|&quot;|["']/gu,'');
  const change=(key,value)=>{if(getValue()[key]===value)return;const next={...getValue()};if(value===undefined)delete next[key];else next[key]=value;onChange(next);summary.textContent=Object.keys(next).length?'文字样式 · 已自定义':'文字样式 · 组件默认';};
  for(const key of Object.keys(labels)) {
    if(key==='textAlign' && metadata.canAlign===false) continue;
    const label=document.createElement('label');label.textContent=labels[key];
    const configured=getValue()[key],value=configured??defaults[key];
    let input;
    if(['fontFamily','fontWeight','textAlign'].includes(key)) {
      input=document.createElement('select');const option=document.createElement('option');option.value='';option.textContent=`组件默认${defaults[key]!==undefined?`（${defaults[key]}）`:''}`;input.append(option);
      const choices=key==='fontFamily'?Object.keys(textFonts).map(x=>[x,x]):key==='fontWeight'?[[300,'细 300'],[400,'常规 400'],[500,'中等 500'],[600,'半粗 600'],[700,'加粗 700'],[800,'粗 800'],[900,'特粗 900']]:[['left','左对齐'],['center','居中'],['right','右对齐']];
      for(const [value,name]of choices){const opt=document.createElement('option');opt.value=value;opt.textContent=name;input.append(opt);}
      input.value=configured??'';input.addEventListener('change',()=>change(key,input.value===''?undefined:key==='fontWeight'?Number(input.value):input.value));
    } else if(key==='color') {
      const row=document.createElement('div');row.className='text-style-color';input=document.createElement('input');input.type='text';input.value=value??'';input.placeholder='组件默认';input.maxLength=7;input.pattern='#[0-9A-Fa-f]{6}';input.spellcheck=false;
      const picker=document.createElement('input');picker.type='color';picker.value=/^#[\da-f]{6}$/iu.test(value??'')?value:'#000000';picker.setAttribute('aria-label',`${fieldLabel}颜色选择器`);
      let dirty=false;
      const commit=()=>{if(!dirty)return;const raw=input.value.trim();const valid=!raw||/^#[\da-f]{6}$/iu.test(raw);input.setCustomValidity(valid?'':'请输入 #RRGGBB 色号');input.classList.toggle('invalid',!valid);if(!valid)return;dirty=false;if(raw)picker.value=raw;change(key,raw?raw.toUpperCase():undefined);};
      input.addEventListener('input',()=>{dirty=true;input.setCustomValidity('');input.classList.remove('invalid');if(!input.value || /^#[\da-f]{6}$/iu.test(input.value))commit();});input.addEventListener('blur',commit);input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();commit();}});
      picker.addEventListener('input',()=>{dirty=true;input.value=picker.value.toUpperCase();commit();});
      row.append(picker,input);label.append(row);
    } else {
      input=document.createElement('input');input.type='number';input.min=textStyleLimits[key][0];input.max=textStyleLimits[key][1];input.step='0.5';input.value=value??'';input.placeholder='组件默认';
      input.addEventListener('input',()=>{const valid=input.validity.valid;input.classList.toggle('invalid',!valid);if(valid)change(key,input.value===''?undefined:Number(input.value));});
    }
    input.dataset.group='textStyles';input.dataset.key=fieldKey;input.dataset.styleProperty=key;input.setAttribute('aria-label',`${fieldLabel} · ${labels[key]}`);
    if(key!=='color')label.append(input);grid.append(label);
  }
  details.append(grid);
  const reset=document.createElement('button');reset.type='button';reset.className='button text-style-reset';reset.textContent='恢复此文案的默认样式';reset.addEventListener('click',()=>{onChange({});});details.append(reset);
  const fontHint=document.createElement('small');fontHint.className='text-style-hint';fontHint.textContent='字体包含回退字体；此处不加载外部字体文件。';details.append(fontHint);
  return details;
}
