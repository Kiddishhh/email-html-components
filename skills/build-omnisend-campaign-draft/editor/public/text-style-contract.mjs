// Shared by the editor and email renderer: only bounded, structured style values.
export const textFonts = {
  Arial: 'Arial,Helvetica,sans-serif', Helvetica: 'Helvetica,Arial,sans-serif',
  Verdana: 'Verdana,sans-serif', Tahoma: 'Tahoma,Arial,sans-serif',
  'Trebuchet MS': 'Trebuchet MS,Arial,sans-serif', Georgia: 'Georgia,serif',
  'Times New Roman': 'Times New Roman,Georgia,serif',
  'Noto Sans SC': 'Noto Sans SC,Arial,Helvetica,sans-serif',
  Montserrat: 'Montserrat,Arial,Helvetica,sans-serif', Lora: 'Lora,Georgia,Times New Roman,serif'
};
export const textStyleLimits = {fontSize:[8,96],lineHeight:[8,160],letterSpacing:[-2,12],spaceBefore:[0,120],spaceAfter:[0,120]};
const properties = {fontFamily:'font-family',fontSize:'font-size',fontWeight:'font-weight',color:'color',lineHeight:'line-height',letterSpacing:'letter-spacing',textAlign:'text-align'};
const object = value => value && typeof value === 'object' && !Array.isArray(value);
function declarations(css) {
  // HTML entities contain semicolons; they are part of a CSS value, not separators.
  const protectedCss = css.replace(/&(?:#\d+|#x[\da-f]+|[a-z]+);/giu, value => value.replace(';', '\u0001'));
  return [...protectedCss.matchAll(/(?:^|;)\s*([\w-]+)\s*:\s*([^;]+)/gu)].map(m => [m[1], m[2].trim().replaceAll('\u0001', ';')]);
}
const styleOf = node => node?.tag.match(/\bstyle="([^"]*)"/u)?.[1] ?? '';
const plainNumber = value => /^-?\d+(?:\.\d+)?(?:px)?$/u.test(value ?? '') ? Number.parseFloat(value) : undefined;
function padding(value = '0') {
  const parts = value.match(/\w+\([^)]*\)|[^\s]+/gu) ?? ['0'];
  return [parts[0],parts[1]??parts[0],parts[2]??parts[0],parts[3]??parts[1]??parts[0]];
}
function resolvedPadding(css, mobile=false) {
  let values=['0','0','0','0'];
  const directions={'padding-top':0,'padding-right':1,'padding-bottom':2,'padding-left':3};
  for(const [key,value]of declarations(css)) {
    if(!mobile && /(?:min|max)\(/u.test(value))continue;
    if(key==='padding')values=padding(value);
    else if(Object.hasOwn(directions,key))values[directions[key]]=value;
  }
  return values;
}
function scan(template, schema) {
  const stack=[], slots=[], nodes=[];
  for (const match of template.matchAll(/<!--[\s\S]*?-->|<[^>]*>|\{\{content\.([^}]+)\}\}/gu)) {
    const token=match[0];
    if(token.startsWith('<!--')) continue;
    if(token.startsWith('</')) { const name=token.match(/^<\/([\w:-]+)/u)?.[1]; const index=stack.map(n=>n.name).lastIndexOf(name); if(index>=0) stack.splice(index); continue; }
    if(token.startsWith('<')) {
      const name=token.match(/^<([\w:-]+)/u)?.[1]; if(!name) continue;
      const node={name,tag:token,index:match.index,keys:new Set()}; nodes.push(node);
      if(!/^(?:img|br|hr|meta|input|link)$/u.test(name) && !token.endsWith('/>')) stack.push(node);
      continue;
    }
    const key=match[1], definition=schema.properties?.[key];
    if(!definition || !['text','string'].includes(definition.type) || definition.role==='image-alt' || definition.editable===false) continue;
    stack.forEach(node=>node.keys.add(key)); slots.push({key,index:match.index,token,ancestors:[...stack]});
  }
  for(const slot of slots) {
    const candidates=slot.ancestors.toReversed().filter(n=>/^(?:td|span|p|a|strong|b|em|i|small|h[1-6])$/u.test(n.name));
    slot.target=candidates.find(n=>n.keys.size===1 && /(?:font-(?:family|size|weight)|line-height|color|text-align):/u.test(styleOf(n)))
      ?? candidates.find(n=>n.keys.size===1);
  }
  return {slots,nodes};
}
export function describeTextFields(template,schema,settings={},cssText='') {
  const rules=[...cssText.replace(/\/\*[\s\S]*?\*\//gu,'').matchAll(/([a-z][\w-]*|\.[\w-]+)\s*\{([^}]*)\}/giu)];
  template=template.replace(/<([a-z][\w-]*)([^>]*?)>/giu,(tag,name,attrs)=>{
    const classes=attrs.match(/\bclass="([^"]*)"/u)?.[1]?.split(/\s+/u)??[];
    const css=rules.filter(m=>m[1]===name || (m[1].startsWith('.') && classes.includes(m[1].slice(1)))).map(m=>m[2].trim()).join(';');
    if(!css) return tag;
    return /\bstyle="/u.test(tag)?tag.replace(/\bstyle="([^"]*)"/u,(_,value)=>`style="${value};${css}"`):tag.replace(/>$/u,` style="${css}">`);
  });
  const result={};
  for(const slot of scan(template,schema).slots) {
    const defaults={spaceBefore:0,spaceAfter:0}, bindings={};
    for(const node of slot.ancestors) {
      // First px declaration is the desktop fallback; min() is its mobile override.
      const css=declarations(styleOf(node));
      for(const [key,prop] of Object.entries(properties)) {
        const entries=css.filter(([name])=>name===prop);
        if(!entries.length) continue;
        if(key in textStyleLimits) {
          const fallback=entries.filter(([,v])=>!/(?:min|max)\(/u.test(v)).at(-1)?.[1];
          let numeric=entries.map(([,v])=>plainNumber(v)).filter(v=>v!==undefined).at(-1);
          if(key==='lineHeight' && defaults.fontSize!==undefined && /^\d+(?:\.\d+)?%?$/u.test(fallback??'')) numeric=defaults.fontSize*Number.parseFloat(fallback)/(fallback.endsWith('%')?100:1);
          if(numeric!==undefined) defaults[key]=numeric;
        }
        else {
          const value=entries.at(-1)[1].replace(/\{\{settings\.([^}]+)\}\}/gu,(_,key)=>settings[key]??'');
          if(value==='inherit') continue;
          const binding=entries.at(-1)[1].match(/^\{\{settings\.([^}]+)\}\}$/u)?.[1];
          if(binding) bindings[key]=binding; else delete bindings[key];
          defaults[key]=key==='fontFamily' ? value.split(',')[0].trim().replace(/&#39;|&quot;|["']/gu,'') : key==='fontWeight'?Number(value)||400:value;
        }
      }
    }
    const pads=resolvedPadding(styleOf(slot.target));
    defaults.spaceBefore=plainNumber(pads[0])??0; defaults.spaceAfter=plainNumber(pads[2])??0;
    const inline = !slot.target || (!/^(?:td|p|h[1-6])$/u.test(slot.target.name) && !/display\s*:\s*block/u.test(styleOf(slot.target)));
    const alignContainer = slot.ancestors.toReversed().find(n => /^(?:td|p)$/u.test(n.name) && n.keys.size === 1);
    result[slot.key]={defaults,bindings,inline,canAlign:!inline || Boolean(alignContainer)};
  }
  return result;
}
export function validateTextStyles(styles, fields) {
  if(styles===undefined) return;
  if(!object(styles)) throw Error('textStyles must be an object');
  for(const [key,style] of Object.entries(styles)) {
    if(!Object.hasOwn(fields,key)) throw Error(`unknown text style field: ${key}`);
    if(!object(style)) throw Error(`textStyles.${key} must be an object`);
    for(const [property,value] of Object.entries(style)) {
      if(property in textStyleLimits) {
        const [min,max]=textStyleLimits[property];
        if(typeof value!=='number' || !Number.isFinite(value) || value<min || value>max) throw Error(`${key}.${property} must be between ${min} and ${max}`);
      } else if(property==='fontFamily') { if(!Object.hasOwn(textFonts,value)) throw Error(`unsupported font: ${value}`); }
      else if(property==='fontWeight') { if(![300,400,500,600,700,800,900].includes(value)) throw Error('unsupported font weight'); }
      else if(property==='color') { if(typeof value!=='string' || !/^#[\da-f]{6}$/iu.test(value)) throw Error('text color must be #RRGGBB'); }
      else if(property==='textAlign') { if(!['left','center','right'].includes(value)) throw Error('unsupported text alignment'); }
      else throw Error(`unknown text style property: ${property}`);
    }
  }
}
const scaled = value => Number((value/6).toFixed(6));
const dimension = value => value===0?'0':`${value<0?'max':'min'}(${value}px,${scaled(value)}vw)`;
export function textStyleCss(style) {
  return Object.entries(properties).flatMap(([key,property])=>{
    if(style[key]===undefined) return [];
    const value=style[key];
    return key in textStyleLimits ? [`${property}:${value}px`,`${property}:${dimension(value)}`] : [`${property}:${key==='fontFamily'?textFonts[value]:value}`];
  }).join(';');
}
function overrideCss(css,style,inline) {
  const replaced=new Set(Object.keys(style).map(key=>properties[key]).filter(Boolean));
  const spacing=style.spaceBefore!==undefined || style.spaceAfter!==undefined;
  if(spacing) for(const key of ['padding','padding-top','padding-right','padding-bottom','padding-left'])replaced.add(key);
  const original=declarations(css);
  const needsSpacingBox = spacing && inline && (original.filter(([key])=>key==='display').at(-1)?.[1] ?? 'inline') === 'inline';
  if(needsSpacingBox)replaced.add('display');
  let result=original.filter(([key])=>!replaced.has(key)).map(([key,value])=>`${key}:${value}`).join(';');
  const extra=textStyleCss(style); if(extra) result+=`;${extra}`;
  if(spacing) {
    const desktop=resolvedPadding(css);
    const mobile=resolvedPadding(css,true);
    for(const [index,key] of [[0,'spaceBefore'],[2,'spaceAfter']]) if(style[key]!==undefined) {desktop[index]=`${style[key]}px`;mobile[index]=dimension(style[key]);}
    result+=`;padding:${desktop.join(' ')};padding:${mobile.join(' ')}`;
    if(needsSpacingBox) result+=';display:inline-block';
  }
  return `${result.replace(/^;/u,'')};`;
}
export function applyTextStyles(template,styles={},schema) {
  const fields=describeTextFields(template,schema); validateTextStyles(styles,fields);
  if(!Object.values(styles).some(style=>Object.keys(style).length)) return template;
  const {slots}=scan(template,schema), edits=new Map();
  for(const slot of slots) {
    const style=styles[slot.key]; if(!style || !Object.keys(style).length) continue;
    if(slot.target) {
      const node=slot.target, css=overrideCss(styleOf(node),style,fields[slot.key].inline);
      let tag=/\bstyle="/u.test(node.tag) ? node.tag.replace(/\bstyle="[^"]*"/u,`style="${css}"`) : node.tag.replace(/>$/u,` style="${css}">`);
      if(style.textAlign!==undefined && /\balign="/u.test(tag)) tag=tag.replace(/\balign="[^"]*"/u,`align="${style.textAlign}"`);
      edits.set(node.index,{length:node.tag.length,value:tag});
    } else edits.set(slot.index,{length:slot.token.length,value:`<span style="${overrideCss('',style,true)}">${slot.token}</span>`});
    if(style.textAlign!==undefined && fields[slot.key].inline) {
      const parent=slot.ancestors.toReversed().find(n=>/^(?:td|p)$/u.test(n.name) && n.keys.size===1);
      if(parent && parent!==slot.target) {
        const css=overrideCss(styleOf(parent),{textAlign:style.textAlign},false);
        let tag=/\bstyle="/u.test(parent.tag)?parent.tag.replace(/\bstyle="[^"]*"/u,`style="${css}"`):parent.tag.replace(/>$/u,` style="${css}">`);
        if(/\balign="/u.test(tag))tag=tag.replace(/\balign="[^"]*"/u,`align="${style.textAlign}"`);
        edits.set(parent.index,{length:parent.tag.length,value:tag});
      }
    }
  }
  for(const [index,edit] of [...edits].sort(([a],[b])=>b-a)) template=template.slice(0,index)+edit.value+template.slice(index+edit.length);
  return template;
}

// Editor font defaults are separate from source component snapshots.
export const editorFontDefaults = 'georgia-verdana';
export function defaultFontForField(key, role) {
  if (role) return ['heading', 'caption'].includes(role) ? 'Georgia' : 'Verdana';
  return /(?:^|\.)(?:title|heading|headline)(?:\.|$)/u.test(key) || key==='product.name' || /^saleItems\[\d+\]\.name$/u.test(key) ? 'Georgia' : 'Verdana';
}
export function applyDefaultFonts(template, schema, roles = {}) {
  // Replace only font-family values. Entity semicolons remain inside the value.
  template = template.replace(/font-family\s*:\s*(?:&(?:#\d+|#x[\da-f]+|[a-z]+);|[^;"<>])+(?=;|")/giu, 'font-family:Verdana,sans-serif');
  const policySchema = {...schema, properties:Object.fromEntries(Object.entries(schema.properties).map(([key,value])=>[key,{...value,editable:true}]))};
  const headings = Object.fromEntries(scan(template,policySchema).slots.filter(slot=>defaultFontForField(slot.key, roles[slot.key])==='Georgia').map(slot=>[slot.key,{fontFamily:'Georgia'}]));
  return applyTextStyles(template,headings,policySchema);
}
