const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../game-source.html'), 'utf8');
for (const match of source.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
const part = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
function game(cash, costs = {}) {
  const c = vm.createContext({cash, owned: new Set(Object.keys(costs)), activePlayer: 1, position: 0, lastRoll: 0,
    players: [{id:1,cash,owned:Object.keys(costs),purchaseCosts:{...costs},houses:{},bankrupt:false},
      {id:2,cash:500,owned:['Rent'],purchaseCosts:{Rent:200},houses:{},bankrupt:false},
      {id:3,cash:500,owned:[],purchaseCosts:{},houses:{},bankrupt:false}],
    requests:[], tradeOpen:false, turnPhase:'action', gameStarted:true, track:['Cat'], leftProperty:true,
    mysteryCards:[['Expense',-100],['Reward',50]], mysteryDeck:[0], drawnCard:null, mysteryPending:false, mysteryReadyAt:null, mysteryCountdownTimer:null,
    performance:{now:()=>0},setTimeout:()=>1,clearTimeout:()=>{},
    animalGroups:{Cat:'test',Dog:'test',Rent:'test'}, groups:{test:{price:100,baseRent:100,animals:['Cat','Dog','Rent']}},
    multipliers:[1,2,4,6,8,10],levels:['No houses','1 house','2 houses','3 houses','4 houses','Hotel'],
    money:n=>'$'+n, render:()=>{}, saveState:()=>{}, renderTrades:()=>{}, drawDie:()=>{},
    root:{querySelector:()=>({})}, updateNameFields:()=>{}, countControl:{}, jailIndex:10,
    purchasePrice:()=>200, recipient:r=>r.kind==='sell'?r.buyer:r.seller});
  vm.runInContext(`const getPlayer=id=>players.find(p=>p.id===id); const playerName=id=>'Player '+id;`, c);
  vm.runInContext(part('      function syncPlayer()', '      function select('),c);
  vm.runInContext(part('      function describeCard(', '      function setOptions('),c);
  vm.runInContext(part('      function pendingPurchase()', '      const pause='),c);
  vm.runInContext(part('      function decideTrade(', '      function renderTrades('),c);
  vm.runInContext(part('      function endTurn()', '      const nameFields='),c);
  vm.runInContext(part('      function applyState(', '      const state=window'),c);
  return c;
}
const run=(c,js)=>vm.runInContext(js,c);
let c=game(120,{Cat:200});run(c,'payExpense(100)');assert.equal(c.cash,20);assert.equal(c.owned.size,1);
c=game(40,{Cat:200,Dog:500});c.requests=[{animal:'Cat'},{animal:'Dog'}];run(c,"settleLanding('Rent')");
assert.equal(c.cash,60);assert.equal(c.players[1].cash,600);assert.deepEqual([...c.owned],['Dog']);assert.equal(c.requests.length,1);assert.equal(run(c,"ownerOf('Cat')"),null);
c=game(0,{Dog:500,Cat:101});run(c,'payExpense(70)');assert.equal(c.cash,290.6);assert.equal(c.owned.size,0);
c=game(40,{Cat:100});run(c,'drawMysteryCard()');assert.equal(c.cash,0);assert.equal(c.players[0].bankrupt,false);
c=game(10,{Cat:100});run(c,"settleLanding('Rent')");assert.equal(c.cash,0);assert.equal(c.players[1].cash,570);assert.equal(c.players[0].bankrupt,true);assert.equal(c.players[0].owned.length,0);
c=game(0);run(c,'drawMysteryCard()');assert.equal(c.players[0].bankrupt,true);
c=game(0);c.mysteryDeck=[1];run(c,'drawMysteryCard()');assert.equal(c.cash,50);
c=game(1000);c.leftProperty=false;run(c,"buy('Cat')");assert.equal(c.players[0].purchaseCosts.Cat,200);
c=game(500);c.requests=[{id:1,animal:'Rent',buyer:1,seller:2,amount:301,kind:'buy'}];run(c,"decideTrade(1,'accept')");assert.equal(c.players[0].purchaseCosts.Rent,301);assert.equal(c.players[1].purchaseCosts.Rent,undefined);c.cash=0;run(c,'payExpense(100)');assert.equal(c.cash,80.6);
c=game(500);c.players[1].bankrupt=true;run(c,'endTurn()');assert.equal(c.activePlayer,3);
c=game(500);c.players[0].bankrupt=true;run(c,'endTurn()');assert.equal(c.activePlayer,2);
c=game(500);c.turnPhase='finished';run(c,'endTurn()');assert.equal(c.activePlayer,1);
c=game(500);c.saved={gameVersion:3,gameStarted:true,activePlayer:1,turnPhase:'action',players:[{id:1,cash:80.6,owned:['Cat'],purchaseCosts:{Cat:301}},{id:2,cash:0,owned:[],bankrupt:true},{id:3,cash:100,owned:['Dog']}]};run(c,'applyState(saved)');assert.equal(c.cash,80.6);assert.equal(c.players[0].purchaseCosts.Cat,301);assert.equal(c.players[2].purchaseCosts.Dog,200);assert.equal(c.players[1].bankrupt,true);
c.saved.players[2].bankrupt=true;run(c,'applyState(saved)');assert.equal(c.turnPhase,'finished');
c=game(0);c.players[2].bankrupt=true;c.turnMessage='';run(c, 'payExpense(100)');
run(c, part("        if(players.filter(player=>!player.bankrupt).length===1)", "        render();"));
assert.equal(c.turnPhase,'finished');assert.match(c.turnMessage,/Player 2 wins!/);
// Shared Mystery Card dialog holds CPU play until a human acknowledges it.
c=game(500);c.track=['Mystery Card'];c.players[0].cpu=true;c.turnMessage='CPU collected $50.';c.mysteryDeck=[1];
run(c,'drawMysteryCard()');assert.equal(c.mysteryPending,true);
const fields={};const dialog={open:false,querySelector:selector=>fields[selector]??=( {textContent:''} ),showModal(){this.open=true;},close(){this.open=false;}};
c.root={querySelector:()=>dialog};
run(c,part('      function takeCpuTurn()', '      function render()'));
run(c,'renderMysteryCard()');assert.equal(dialog.open,true);assert.match(fields['.mystery-player'].textContent,/CPU/);assert.equal(fields['.mystery-amount'].textContent,'Collect $50');
run(c,'takeCpuTurn()');assert.equal(c.activePlayer,1);
run(c,'endTurn()');assert.equal(c.activePlayer,1);
c.render=()=>run(c,'renderMysteryCard()');
assert.equal(fields['.mystery-continue'].textContent,'Continue in 10s');
run(c,'acknowledgeMysteryCard()');assert.equal(dialog.open,true);
c.performance.now=()=>9999;run(c,'updateMysteryCountdown()');assert.equal(fields['.mystery-continue'].disabled,true);
run(c,'acknowledgeMysteryCard()');assert.equal(c.mysteryPending,true);
c.performance.now=()=>10000;run(c,'updateMysteryCountdown()');assert.equal(fields['.mystery-continue'].disabled,false);
run(c,'acknowledgeMysteryCard()');assert.equal(dialog.open,false);assert.equal(c.mysteryPending,false);
run(c,'takeCpuTurn()');assert.equal(c.activePlayer,2);
c.saved={gameVersion:3,gameStarted:true,activePlayer:1,turnPhase:'action',drawnCard:0,mysteryPending:true,players:[{id:1,cpu:true,cash:100,owned:[]},{id:2,cash:100,owned:[]}]};run(c,'applyState(saved)');assert.equal(c.mysteryPending,true);assert.equal(dialog.open,true);assert.equal(fields['.mystery-amount'].textContent,'Pay $100');assert.equal(fields['.mystery-continue'].textContent,'Continue in 10s');
// Building requires the complete color set and charges for each house.
c=game(500,{Cat:200,Dog:200});run(c,"buildHouse('Cat')");assert.equal(c.cash,500);assert.equal(c.players[0].houses.Cat,undefined);
c.players[1].owned=[];c.owned.add('Rent');run(c,"buildHouse('Cat')");assert.equal(c.cash,400);assert.equal(c.players[0].houses.Cat,1);assert.equal(run(c,"propertyRent('Cat')"),200);
for(let n=0;n<4;n++) run(c,"buildHouse('Cat')");assert.equal(c.cash,0);assert.equal(c.players[0].houses.Cat,5);assert.equal(run(c,"propertyRent('Cat')"),1000);
c.cash=500;run(c,"buildHouse('Cat')");assert.equal(c.cash,500);assert.equal(c.players[0].houses.Cat,5);
c.cash=99;run(c,"buildHouse('Dog')");assert.equal(c.cash,99);assert.equal(c.players[0].houses.Dog,undefined);
c.cash=500;c.mysteryPending=true;run(c,"buildHouse('Dog')");assert.equal(c.cash,500);
c=game(500,{Cat:200,Dog:200});c.groups.test.animals=['Cat','Dog'];run(c,"buildHouse('Cat')");assert.equal(c.players[0].houses.Cat,1);
c.players[0].houses.Cat=3;c.cash=0;run(c,'payExpense(100)');assert.equal(c.players[0].houses.Cat,undefined);assert.equal(run(c,"completeSet(1,'test')"),false);
c=game(500);c.players[1].houses.Rent=2;run(c,"settleLanding('Rent')");assert.equal(c.cash,100);assert.equal(c.players[1].cash,900);
c=game(500);c.players[1].houses.Rent=2;c.requests=[{id:1,animal:'Rent',buyer:1,seller:2,amount:301,kind:'buy'}];run(c,"decideTrade(1,'accept')");assert.equal(c.players[0].houses.Rent,2);assert.equal(c.players[1].houses.Rent,undefined);
c=game(500);c.saved={gameVersion:3,gameStarted:true,activePlayer:1,players:[{id:1,cash:400,owned:['Cat'],houses:{Cat:3}},{id:2,cash:100,owned:['Dog'],houses:{Dog:99}},{id:3,cash:100,owned:['Rent']}]};run(c,'applyState(saved)');assert.equal(c.players[0].houses.Cat,3);assert.equal(c.players[1].houses.Dog,0);assert.equal(c.players[2].houses.Rent,0);
// Houses can be sold voluntarily with plenty of cash, before or after rolling.
c=game(2000,{Cat:200});c.players[0].houses.Cat=3;c.turnPhase='roll';run(c,"sellHouse('Cat')");assert.equal(c.cash,2060);assert.equal(c.players[0].houses.Cat,2);assert.equal(run(c,"propertyRent('Cat')"),400);assert.equal(c.owned.has('Cat'),true);
c.turnPhase='action';run(c,"sellHouse('Cat')");assert.equal(c.cash,2120);assert.equal(c.players[0].houses.Cat,1);
run(c,"sellHouse('Cat')");run(c,"sellHouse('Cat')");assert.equal(c.cash,2180);assert.equal(c.players[0].houses.Cat,0);
c.players[1].houses.Rent=2;run(c,"sellHouse('Rent')");assert.equal(c.cash,2180);assert.equal(c.players[1].houses.Rent,2);
c.players[0].houses.Cat=5;run(c,"sellHouse('Cat')");assert.equal(c.players[0].houses.Cat,4);assert.equal(c.cash,2240);
c.mysteryPending=true;run(c,"sellHouse('Cat')");assert.equal(c.cash,2240);
c.mysteryPending=false;c.turnPhase='finished';run(c,"sellHouse('Cat')");assert.equal(c.cash,2240);
// Voluntary property sales return the actual recorded price's 60%.
c=game(2000,{Cat:301,Dog:200});c.turnPhase='roll';c.track=['Cat'];c.leftProperty=false;c.requests=[{animal:'Cat'},{animal:'Dog'}];run(c,"sellProperty('Cat')");assert.equal(c.cash,2180.6);assert.equal(c.owned.has('Cat'),false);assert.equal(c.players[0].purchaseCosts.Cat,undefined);assert.equal(c.requests.length,1);assert.equal(c.leftProperty,true);assert.equal(run(c,"ownerOf('Cat')"),null);
run(c,"sellProperty('Cat')");run(c,"sellProperty('Rent')");assert.equal(c.cash,2180.6);
c.players[0].houses.Dog=1;c.turnPhase='action';run(c,"sellProperty('Dog')");assert.equal(c.owned.has('Dog'),false);assert.equal(c.cash,2360.6);assert.equal(c.players[0].houses.Dog,undefined);
run(c,"sellHouse('Dog')");run(c,"sellProperty('Dog')");assert.equal(c.owned.size,0);assert.equal(c.cash,2360.6);
for(const level of [2,3,4,5]) {c=game(2000,{Cat:301});c.players[0].houses.Cat=level;run(c,"sellProperty('Cat')");assert.equal(c.cash,2180.6+level*60);assert.equal(c.players[0].houses.Cat,undefined);assert.equal(run(c,"houseLevel('Cat')"),0);}
c=game(2000,{Cat:200});c.mysteryPending=true;run(c,"sellProperty('Cat')");assert.equal(c.owned.size,1);c.mysteryPending=false;c.turnPhase='finished';run(c,"sellProperty('Cat')");assert.equal(c.owned.size,1);
console.log('Passed voluntary property-sale checks: actual-price refund, ownership, repeat-sale prevention, trade cleanup, house and hotel refunds, and turn guards.');
console.log('Passed voluntary house-sale checks: 60% refund, ownership, rent decrease, full-cash sales, before/after roll, incomplete sets, repeated sales, and hotel downgrade.');
console.log('Passed house checks: complete sets of three and two, insufficient cash, hotel cap, modal guard, rent, trades, forced sales, and save restoration.');
console.log('Passed Mystery Card checks: large-dialog content, CPU pause, blocked end turn, Continue resumes play, and restored pending cards.');
console.log('Passed economy checks: forced sales, sale order, exact 60% returns, rent transfers, cards, bankruptcy, purchases, negotiated prices, skipped turns, game-over lock, and saved-game migration.');
