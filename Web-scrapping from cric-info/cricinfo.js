//node cricinfo.js --excel=worldcup.csv --datadir=worldcup  --source=https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results

let minimist=require('minimist');
let jsdom=require('jsdom');
let axios=require('axios');
let excel=require('excel4node');
let pdf=require('pdf-lib');
let fs=require("fs");
let path=require("path");


let args=minimist(process.argv);


let promise=axios.get(args.source);
promise.then(function(response){
    let html=response.data;
    let dom=new jsdom.JSDOM(html);

    let document=dom.window.document;
    let matches=[];
    let matchdivs=document.querySelectorAll("div.match-score-block");
    for(let i=0;i<matchdivs.length;++i)
    {
        let matchdiv=matchdivs[i];
        let match={
            t1:"",
            t2:"",
            t1s:"",
            t2s:"",
            result:""
        };

        let teampara=matchdiv.querySelectorAll("div.name-detail > p.name");
        match.t1=teampara[0].textContent;
        match.t2=teampara[1].textContent;

        let score=matchdiv.querySelectorAll("div.score-detail > span.score");
        if(score.length==2)
        {
            match.t1s=score[0].textContent;
            match.t2s=score[1].textContent;
        }
        else if(score.length==1)
        {
            match.t1s=score[0].textContent;
            match.t2s="";
        }
        else{
            match.t1s="";
            match.t2s="";
        }

        let res=matchdiv.querySelector("div.status-text > span");
        match.result=res.textContent;
        matches.push(match);
    }
    
    let teams=[];
    for(let i=0;i<matches.length;++i){
        populateMatches(teams,matches[i]);
    }
    
    for(let i=0;i<matches.length;++i){
        populateTeams(matches[i],teams);
    }

    let datafinal=JSON.stringify(teams);
    
    CreateExcel(datafinal);

    CreateFolder(teams);


})

function populateMatches(teams,match)
{
    let t1idx=teams.findIndex(function(team){
        if(team.name==match.t1)
        {
            return true;
        }
        else{
            return false;
        }
    });

    if(t1idx==-1)
    {
        teams.push({
            name: match.t1,
            matches: []
        });
    }

    let t2idx=teams.findIndex(function(team){
        if(team.name==match.t2)
        {
            return true;
        }
        else{
            return false;
        }
    });

    if(t2idx==-1)
    {
        teams.push({
            name: match.t2,
            matches: []
        });
    }
    

}

function populateTeams(match,teams)
{
    for(let i=0;i<teams.length;++i)
    {
        if(teams[i].name==match.t1) 
        {
            teams[i].matches.push({
                vs: match.t2,
                selfscore: match.t1s,
                opponentscore: match.t2s,
                result: match.result
            })
            break;
        }   
                   
    }
    for(let j=0;j<teams.length;++j)
    {
        if(teams[j].name==match.t2) 
        {
            teams[j].matches.push({
                vs: match.t1,
                selfscore: match.t1s,
                opponentscore: match.t2s,
                result: match.result
            })
            break;
        } 
    }
}

function CreateExcel(data)
{
    let wb=new excel.Workbook();
    let teams=JSON.parse(data);
    for(let i=0;i<teams.length;++i)
    {
        let sheet=wb.addWorksheet(teams[i].name);
        sheet.cell(1,1).string("Opponent");
        sheet.cell(1,2).string("Self-score");
        sheet.cell(1,3).string("Opponent-score");
        sheet.cell(1,4).string("Result");
        for(let j=0;j<teams[i].matches.length;++j)
        {
            sheet.cell(j+2,1).string(teams[i].matches[j].vs);
            sheet.cell(j+2,2).string(teams[i].matches[j].selfscore);
            sheet.cell(j+2,3).string(teams[i].matches[j].opponentscore);
            sheet.cell(j+2,4).string(teams[i].matches[j].result);
        }
    }
    wb.write(args.excel);
}

function CreateFolder(teams)
{
    fs.mkdirSync(args.datadir);
    for(let i=0;i<teams.length;++i)
    {
        let teamsfn=path.join(args.datadir,teams[i].name);
        fs.mkdirSync(teamsfn);

        for(let j=0;j<teams[i].matches.length;++j)
        {
            let matchfliename=path.join(teamsfn,teams[i].matches[j].vs+".pdf");
            createScorecard(teams[i],teams[i].matches[j],matchfliename);
        }
    }

}

function createScorecard(teamName,matches,matchFileName)
{
    let t1=teamName;
    let t2=matches.vs;
    let t1s=matches.selfscore;
    let t2s=matches.opponentscore;
    let result=matches.result;
    let template=fs.readFileSync("template.pdf");
    let pdfpromise=pdf.PDFDocument.load(template);
    pdfpromise.then(function(pdfdoc){
        let page=pdfdoc.getPage(0);

        
        page.drawText(t2,{
            x: 280,
            y: 560,
            size: 12
        });
        page.drawText(t1s,{
            x: 280,
            y: 530,
            size: 12
        });
        page.drawText(t2s,{
            x: 280,
            y: 500,
            size: 12
        });
        page.drawText(result,{
            x: 280,
            y: 470,
            size: 12
        });

        let finalbyte=pdfdoc.save();
        finalbyte.then(function(finalbyte){
            fs.writeFileSync(matchFileName,finalbyte);
        })
    })  
}















