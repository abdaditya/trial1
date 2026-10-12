import {chromium} from '/opt/node22/lib/node_modules/playwright/index.mjs';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const o of 'ABCD'){const p=await b.newPage({viewport:{width:1080,height:1920}});await p.goto('file://'+process.cwd()+'/o.html#'+o);await p.waitForTimeout(800);await p.screenshot({path:`opt_${o}.png`});}
await b.close();
