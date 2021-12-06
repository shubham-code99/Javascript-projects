//node ResumeParser.js --url=https://www.google.com/intl/en_in/drive/ --formurl=https://docs.google.com/forms/d/1ZPdxTZd16R0voYR0eLzRKih6Tr_-N0dIrO7zbSFsWPI/edit --config=config.json

let minimist=require('minimist');
let puppeteer=require('puppeteer');
let fs=require('fs');
const { isUndefined } = require('util');

let args=minimist(process.argv);

let configJSON=fs.readFileSync(args.config,'utf-8');
let configobj=JSON.parse(configJSON);

async function run(){
    let browser=await puppeteer.launch({
        headless: false,
        args: ["--start-maximized"],
        defaultViewport: null,
    });
    
    let pages= await browser.pages();
    let page=pages[0];
    await page.goto(args.url);

    await page.waitForSelector("a[data-action='go to drive']");
    let url=await page.$eval("a[data-action='go to drive']",function(atags){
        let u=atags.getAttribute("href");
        return u;
    })

    await page.goto(url);
    

    await page.waitForSelector("input#identifierId");
    await page.type("input#identifierId",configobj.userId,{ delay:20 });

    await page.waitForSelector("button[jsname=LgbsSe]");
    await page.click("button[jsname=LgbsSe]");

    await page.waitFor(3000);

    await page.waitForSelector("input[jsname='YPqjbf']");
    await page.type("input[jsname='YPqjbf']",configobj.password,{ delay:20 });

    await page.waitForSelector("button[jsname=LgbsSe]");
    await page.click("button[jsname=LgbsSe]");
    await page.waitFor(5000);

    await page.goto(configobj.Formurl);
    await page.waitFor(3000);
  
    await page.waitForSelector("div[data-action-id='freebird-view-responses']");
    await page.click("div[data-action-id='freebird-view-responses']");
    await page.waitFor(3000);



    await page.waitForSelector("div[jscontroller='By0w6'] > div[jscontroller='mPmmob']");
    let urls=await page.$$eval("div[jscontroller='By0w6'] > div[jscontroller='mPmmob']",function(divs){
        let all=[];
        for(let i=0;i<divs.length;++i){
            let url=divs[i].getAttribute('data-view-file-link');
            all.push(url);
        }
        return all;
    });

    for(let i=0;i<urls.length-1;++i){
        let ctab=await browser.newPage();
        await downloadfromall(ctab,"https:" + urls[i]);
        await ctab.close();
        await ctab.waitFor(2000);
    }
    
    

}

async function downloadfromall(ctab,url){
    await ctab.bringToFront();
    await ctab.goto(url);
    await ctab.waitFor(3000);  
    
    await ctab.waitForSelector("div.ndfHFb-c4YZDc-cYSp0e-DARUcf-PLDbbf > a");
    let links= await ctab.$$eval("div.ndfHFb-c4YZDc-cYSp0e-DARUcf-PLDbbf > a",function(atags){
        return atags.length;
    });

    let value=0;
    for(let i=0;i<configobj.skills.length;++i){
        let found = (await ctab.content());
        let ans=-1;
        found=found.toLowerCase();
        let str=configobj.skills[i];
        str=str.toLowerCase();
        ans=found.includes(str);
        if(ans==true) value+=1;
      
    }
    if(links>=8 && value>=configobj.skills.length/2){

        await ctab.waitForSelector("div[aria-label='Download']");
        await ctab.click("div[aria-label='Download']");
    }
    ctab.waitFor(2000);
}

run();