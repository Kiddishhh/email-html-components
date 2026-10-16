from pathlib import Path
p=Path(__file__).parent
style='<style>'+ (p/'fonts.css').read_text() + '</style>'
def ticket(label,code,percent=False):
 value = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td class="fw-value" style="display:block;font-size:56px;line-height:72px;font-weight:400;color:#ffffff">15</td><td align="left" style="color:#ffffff"><span class="fw-percent" style="display:block;font-size:34px;line-height:34px;font-weight:700">%</span><span class="fw-off" style="display:block;font-size:20px;line-height:21px;font-weight:700">off</span></td></tr></table>' if percent else '<span class="fw-value" style="display:block;font-size:56px;line-height:72px;font-weight:400;color:#ffffff">$15</span>'
 return f'''<td width="45%" height="145" class="fw-ticket" align="center" valign="middle" background="COUPON_URL" style="height:145px;background-image:url('COUPON_URL');background-repeat:no-repeat;background-position:center;background-size:100% 100%">
<!--[if gte mso 9]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:243px;height:145px"><v:fill type="frame" src="COUPON_URL" color="#af2528"/><v:textbox inset="0,0,0,0"><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:Montserrat,Arial,Helvetica,sans-serif;text-align:center;color:#ffffff"><tr><td class="fw-label" style="padding:12px 4px 0;font-size:16px;line-height:20px;font-weight:500;letter-spacing:0px;text-align:center">{label}</td></tr><tr><td>{value}</td></tr><tr><td class="fw-code" style="padding:0 3px 12px;font-size:16px;line-height:20px;font-weight:500;letter-spacing:0px;text-align:center;white-space:nowrap">With Code <span style="text-decoration:underline;color:#ffffff">{code}</span></td></tr></table>
<!--[if gte mso 9]></v:textbox></v:rect><![endif]--></td>'''
component='''<table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#faf9f7" style="width:100%;max-width:600px;margin:0 auto;background-color:#faf9f7;color:#222222">
<tr><td align="center" bgcolor="#f4f1ed" style="padding:13px 0;background-color:#f4f1ed"><img src="LOGO_URL" alt="FreShine" width="90" height="29" style="display:block;width:90px;height:29px;border:0;margin:0 auto"></td></tr>
<tr><td align="center" class="fw-title" style="padding:44px 15px 29px;font-family:Lora,Georgia,'Times New Roman',serif;font-size:36px;line-height:46px;font-weight:400;letter-spacing:0px;text-align:center">Welcome To Freshine</td></tr>
<tr><td align="center" class="fw-subtitle" style="padding:0 25px 28px;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;line-height:150%;font-weight:500;letter-spacing:0px;text-align:center">Your Swatch Fee Is On Us — $15 Off Your Next Order.</td></tr>
<tr><td class="fw-inset" style="padding:0 30px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout:fixed"><tr>'''+ticket('$15 Swatch Credit','SWATCH15')+'''<td width="10%" align="center" class="fw-plus" style="font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:43px;line-height:50px;color:#222222">+</td>'''+ticket('Get Extra','NEW15',True)+'''</tr></table></td></tr>
<tr><td align="center" class="fw-terms" style="padding:23px 25px 25px;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:16px;line-height:20px;font-weight:500;font-style:italic;letter-spacing:0px;text-align:center;color:#817870">NEW CUSTOMERS ONLY · BOTH OFFERS CAN BE COMBINED</td></tr>
<tr><td align="center" class="fw-bottom" style="padding:0 20px 42px"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="260" style="width:260px;max-width:100%"><tr><td align="center" style="border:1px solid #222222"><a href="ORDER_URL" class="fw-cta" style="display:block;padding:17px 12px;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:16px;line-height:20px;font-weight:600;letter-spacing:0px;text-align:center;text-decoration:none;color:#222222">START YOUR ORDER</a></td></tr></table></td></tr></table>'''
head='<!doctype html>\n<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Welcome To Freshine</title>'+style+'</head><body style="margin:0;padding:0">'
footer='''<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto"><tr><td align="center" style="padding:20px;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;color:#817870">{{ shop.name | escape }}<br>{{ shop.address.address1 | escape }} {{ shop.address.address2 | escape }}<br>{{ shop.address.city | escape }} {{ shop.address.province | escape }} {{ shop.address.zip | escape }} {{ shop.address.country | escape }}<br><a href="{{ unsubscribe_url }}" style="color:#817870;text-decoration:underline">Unsubscribe</a></td></tr></table>{{ open_tracking }}'''
from html import escape
urls = {
 'LOGO_URL': 'https://cdn.shopify.com/s/files/1/0901/6888/5527/files/Freshine_logo_2_4.png?v=1788850731',
 'COUPON_URL': 'https://cdn.shopify.com/s/files/1/0901/6888/5527/files/90622b10c0440d10abb8ab10eeaa5143.png?v=1788850876',
 'ORDER_URL': 'https://freshinelife.com?utm_source=shopify-flow&utm_medium=email&utm_id=cover-rc',
}
for token, url in urls.items():
 component = component.replace(token, escape(url, quote=True))
import re
responsive_properties={'font-size','line-height','width','height','padding','padding-top','padding-bottom','padding-left','padding-right','margin','border-radius'}
def scale_style(match):
 out=[]
 for declaration in match.group(1).split(';'):
  out.append(declaration)
  prop,sep,value=declaration.partition(':')
  if prop in responsive_properties and re.search(r'([0-9.]+)px',value):
   scaled=re.sub(r'([0-9.]+)px',lambda m: 'min('+m[0]+','+format(float(m[1])/6,'.6f').rstrip('0').rstrip('.')+'vw)' if float(m[1])>1 else m[0],value)
   if scaled!=value: out.append(prop+':'+scaled)
 return 'style="'+';'.join(out)+'"'
component=re.sub(r'style="([^"]*)"',scale_style,component)
# Fragment is a single presentation table; font-face declarations belong to the host email head.
# HTML import file uses only Messaging's documented output variables in its footer.
(p/'email.code-your-own.html').write_text(head+component+footer+'</body></html>')
(p/'component.html').write_text(component)
preview=head+component+'</body></html>'
(p/'index.html').write_text(preview)
(p/'compare.html').write_text('<!doctype html><html><body style="margin:0;display:flex;gap:20px;background:#eee"><img src="assets/reference.png" style="width:606px;height:auto;align-self:flex-start"><iframe src="index.html" style="border:0;width:600px;height:620px"></iframe></body></html>')
print('Created component, full Messaging HTML and local preview. Full email bytes:',(p/'email.code-your-own.html').stat().st_size)
