from pathlib import Path
from html import escape
import re
p=Path(__file__).parent
logo='https://cdn.shopify.com/s/files/1/0901/6888/5527/files/Freshine_logo_2_4.png?v=1788850731'
coupon='https://cdn.shopify.com/s/files/1/0901/6888/5527/files/2279.png?v=1788853778'
link='https://freshinelife.com?utm_source=shopify-flow&utm_medium=email&utm_id=cover-rc'
font='font-family:Montserrat,Arial,Helvetica,sans-serif;'
copy=font+'font-size:16px;line-height:20px;font-weight:500;letter-spacing:0px;text-align:center;'
component=f'''<table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#faf9f7" style="width:100%;max-width:600px;margin:0 auto;background-color:#faf9f7;color:#222222;border-spacing:0">
<tr><td align="center" bgcolor="#f4f1ed" style="padding:13px 0;background-color:#f4f1ed"><img src="{logo}" alt="FreShine" width="90" height="29" style="display:block;width:90px;height:29px;border:0;margin:0 auto"></td></tr>
<tr><td class="ft-title" align="center" style="padding:44px 15px 24px;font-family:Lora,Georgia,'Times New Roman',serif;font-size:36px;line-height:46px;font-weight:400;letter-spacing:0px;text-align:center">Welcome To Freshine</td></tr>
<tr><td class="ft-subtitle" align="center" style="padding:0 25px 24px;{font}font-size:20px;line-height:150%;font-weight:500;letter-spacing:0px;text-align:center">On Top Of Your Tier Discount.</td></tr>
<tr><td align="center" style="padding:0"><table role="presentation" align="center" width="463" cellpadding="0" cellspacing="0" border="0" style="width:463px;max-width:100%;table-layout:fixed"><tr><td class="ft-ticket" height="119" valign="middle" background="{coupon}" style="height:119px;background-image:url('{coupon}');background-position:center;background-size:100% 100%;background-repeat:no-repeat">
<!--[if gte mso 9]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:463px;height:119px"><v:fill type="frame" src="{coupon}" color="#af2528"/><v:textbox inset="0,0,0,0"><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout:fixed;{font}color:#ffffff"><tr>
<td width="46.436285%" align="center" valign="middle" style="padding:10px 0"><table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td class="ft-label" align="center" style="{font}font-size:20px;line-height:24px;font-weight:500;letter-spacing:0px;text-align:center;color:#ffffff">Your Extra</td></tr><tr><td align="center"><table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td class="ft-value" style="{font}font-size:64px;line-height:68px;font-weight:500;letter-spacing:0px;color:#ffffff">15</td><td valign="middle" style="{font}color:#ffffff"><span style="display:block;font-size:32px;line-height:34px;font-weight:700">%</span><span style="display:block;font-size:22px;line-height:23px;font-weight:700">off</span></td></tr></table></td></tr></table></td>
<td width="53.563715%" align="center" valign="middle" style="padding:10px 0 10px 11px"><table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td class="ft-label" align="center" style="padding:0 0 13px;{font}font-size:20px;line-height:24px;font-weight:500;letter-spacing:0px;text-align:center;color:#ffffff">Use Code</td></tr><tr><td class="ft-code" align="center" bgcolor="#ffffff" style="width:123px;height:38px;background-color:#ffffff;border-radius:2px;{font}font-size:20px;line-height:24px;font-weight:700;letter-spacing:0px;text-align:center;color:#981b1e"><span style="text-decoration:underline">NEW15</span></td></tr></table></td>
</tr></table>
<!--[if gte mso 9]></v:textbox></v:rect><![endif]-->
</td></tr></table></td></tr>
<tr><td class="ft-terms" align="center" style="padding:24px 20px;{copy}font-style:italic;color:#817870">NEW CUSTOMERS ONLY. ONE-TIME USE.</td></tr>
<tr><td align="center" style="padding:0 20px 29px"><table role="presentation" width="340" align="center" cellpadding="0" cellspacing="0" border="0" style="width:340px;max-width:100%"><tr><td align="center" style="border:1px solid #222222;border-radius:28px"><a class="ft-cta" href="{escape(link,quote=True)}" style="display:block;padding:17px 10px;{font}font-size:16px;line-height:20px;font-weight:600;letter-spacing:0px;text-align:center;text-decoration:none;color:#222222;border-radius:28px">SHOP CUSTOM CURTAINS</a></td></tr></table></td></tr>
</table>'''
props={'font-size','line-height','width','height','padding','margin','border-radius'}
def scale(m):
 out=[]
 for d in m[1].split(';'):
  out.append(d);k,_,v=d.partition(':')
  if k in props:
   v2=re.sub(r'([0-9.]+)px',lambda n:'min('+n[0]+','+format(float(n[1])/6,'.6f').rstrip('0').rstrip('.')+'vw)' if float(n[1])>1 else n[0],v)
   if v2!=v:out.append(k+':'+v2)
 return 'style="'+';'.join(out)+'"'
component=re.sub(r'style="([^"]*)"',scale,component)
(p/'component.html').write_text(component)
head='<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Freshine Extra 15% Coupon</title><style>'+(p/'fonts.css').read_text()+'</style></head><body style="margin:0;padding:0">'
(p/'index.html').write_text(head+component+'</body></html>')
(p/'compare.html').write_text('<!doctype html><html><body style="margin:0;display:flex;gap:16px"><img src="assets/reference.png" style="width:612px;height:auto;align-self:flex-start"><iframe src="index.html" width="600" height="550" style="border:0"></iframe></body></html>')
print('Built standalone HTML:',len(component.encode()),'bytes')
