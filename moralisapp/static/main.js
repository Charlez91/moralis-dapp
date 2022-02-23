const serverUrl = "https://jtb32opiwmkb.usemoralis.com:2053/server";
const appId = "bXNxgKxvx1qRQxvL1id2NgNZKBiZRHyehiVHPPa9";

Moralis.start({serverUrl, appId});

async function login(){
    let user = Moralis.User.current();
    if (!user){
        user = await Moralis.authenticate({signingMessage:"Welcome Dog Boy"});
        document.getElementById('logOut').removeAttribute('disabled');
        document.getElementById('login').setAttribute('disabled', null);
        let address= user.get('ethAddress');
        console.log('User logged in!:', user);
        console.log(address);
        document.getElementById('ethAddress').innerHTML= address;
        getStats();
        populate();

        //get balance of the signed in/native address
        const options = {chain: "bsc", address: address}
        const balance = await Moralis.Web3API.account.getNativeBalance(options)
        document.getElementById("balance").innerHTML = balance['balance']/ 10**18;

        async function populate(){
            //to show table of coins and there balances for a given address
            const balances = await Moralis.Web3API.account.getTokenBalances({chain:"bsc"}).then(buildTableBalances);
            console.log("balances");
        }
        
    }
}

async function logOut(){
    await Moralis.User.logOut();
    console.log('User logged out');
    document.getElementById('logOut').setAttribute('disabled', null);
    document.getElementById('login').removeAttribute('disabled');

}

function buildTableBalances(data){
    document.getElementById("resultBalances").innerHTML = `<table class="table table-dark table-striped" id="balancesTable">
                                                            </table>`;
    const table = document.getElementById("balancesTable");
    const rowHeader = `<thead>
                            <tr>
                                <th>Token</th>
                                <th>Symbol</th>
                                <th>Balance</th>
                                <th>Decimals</th>
                            </tr>
                        </thead>`
    table.innerHTML += rowHeader;
    for (let i=0; i < data.length; i++){
      
        let row = `<tr>
                        <td>${data[i].name}</td>
                        <td>${data[i].symbol}</td>
                        <td>${Moralis.Units.FromWei(data[i].balance,data[i].decimals )}</td>
                        <td>${data[i].decimals}</td>
                    </tr>`
        table.innerHTML += row
    }
  }

function getStats(){
    const user = Moralis.User.current();
    if (user){
        getUserTransactions(user);
    }
    getAverageGasPrices();

}

async function getUserTransactions(user){
    //create a moralis query
    const query = new Moralis.Query('EthTransactions')
    query.equalTo("from_address", user.get('ethAdress')) 

    //here we subscribe to query(notification of new transactions)
    const subscription = await query.subscribe();
    handleNewTransactions(subscription)

    //we then run the query
    const results = await query.find();
    console.log('User Transactions:', results)
}

async function handleNewTransactions(subscription){
    // log each new transaction
    subscription.on("create", function(data) {
    console.log("new transaction: ", data);
    })
}

async function getAverageGasPrices(){
    const results = await Moralis.Cloud.run("getAvgGas");
    console.log("Average User Gas Prices:", results);
    renderGasStats(results)

}

function renderGasStats(data) {
    const container = document.getElementById("gas-stats");
    container.innerHTML = data
      .map(function (row, rank) {
        return `<li>#${rank + 1}: ${Math.round(row.avgGas)} gwei</li>`;
      })
      .join("");
}

async function getTokenPrice(){
    //getting a token price of a coin in pancakeswap
    const options = {
        address: document.getElementById('tokenAddress').value,
        chain: "bsc",
        exchange: "Pancakeswapv2",
    };
    const price = await Moralis.Web3API.token.getTokenPrice(options);
    document.getElementById('price').innerHTML = price['usdPrice'];
    console.log('Token Price:', price);
}

async function send(){
    const options = {
        type:"native", 
        amount: Moralis.Units.Eth(document.getElementById('amount').value),
        receiver: document.getElementById('receiver').value,
    }
    let result = await Moralis.transfer(options)
}

document.getElementById('getTokenPrice').onclick = getTokenPrice;
document.getElementById('send').onclick = send;