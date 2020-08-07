const express = require('express');

var app = express();


//var bodyParser = require('body-parser');
app.use(express.static('public'));

/*
1 - Expor uma API que recebe um intervalo de datas (leva-se em conta a data de início e de fim) e um estado
Ex: http://localhost/?state=PR&dateStart=2020-05-10&dateEnd=2020-05-18

2 - Consumir as informações do WebService sobre casos de Covid19 disponível no endereço
https://brasil.io/api/dataset/covid19/caso/data/?state=PR&date=2020-05-10


3 - Calcular as top 10 cidades com maior aumento percentual de casos em relação a população total da cidade no período

Exemplos:

Curitiba - 1000 habitantes
01/01 -> 10 casos
31/01 -> 15 casos

Representa um aumento de 5 casos para 1000 habitantes (0.5% de aumento)

São Paulo - 10000 habitantes
01/01 -> 10 casos
31/01 -> 30 casos

Representa um aumento de 20 casos para 10000 habitantes (0.2% de aumento)

4 - Após filtrar as informações desejadas, fazer um POST para cada posição no seguinte formato:

Endpoint

https://us-central1-lms-nuvem-mestra.cloudfunctions.net/testApi

Method
POST

Header

MeuNome: Diego //Alterar para seu nome

Body

{
id: [0-9], // conforme a posição, sendo 0 o maior número de casos
nomeCidade: nomeCidade,
percentualDeCasos: x
}
*/

async function getData(state, date){
    const axios = require('axios');

    let response = await axios.get(`https://brasil.io/api/dataset/covid19/caso/data/?state=${state}&date=${date}`);

    return response.data["results"];
}

// async function postData(id, cityData){
//     const axios = require('axios');
//     await axios.post('https://us-central1-lms-nuvem-mestra.cloudfunctions.net/testApi', 
//                 { 
//                   headers: { 'MeuNome': 'Gustavo' },
//                   Body: {
//                       id: id,
//                       nomeCidade: cityData['city'],
//                       percentualDeCasos: cityData['increase']
//                     },
//                 })
//                .then(function(response){
//                     console.log('salvo com sucesso')
//                 })
//                 .catch(error => {
//                     console.log("Error POST request: " + error)
//                 });
// }

async function postData(id, cityData){
    const axios = require('axios');
    await axios.post('https://us-central1-lms-nuvem-mestra.cloudfunctions.net/testApi', 
                { 
                  Header: { 'MeuNome': 'Gustavo' },
                  Body: {
                      id: id,
                      nomeCidade: cityData['city'],
                      percentualDeCasos: cityData['increase']
                    },
                })
               .then(function(response){
                    console.log('salvo com sucesso')
                })
                .catch(error => {
                    console.log("Error in postData: " + error)
                });
}

app.get('/', (req,res) =>{
    
    queryData = {
        state:req.query.state,
        dateStart:req.query.dateStart,
        dateEnd:req.query.dateEnd,
    };

    if(queryData.state && queryData.dateStart && queryData.dateEnd){

        var a = getData(queryData.state, queryData.dateStart);
        var b = getData(queryData.state, queryData.dateEnd);

        Promise.all([a, b]).then((values) => {
            var dayStart = values[0];
            var dayEnd = [];
            var arrayCities = [];
            var promCities = [];

            dayStart.forEach(el => dayEnd.push(values[1].find(e => e.city == el.city)));
            
            for(j in dayStart){
                //console.log(dayStart[j]['city'] == dayEnd[j]['city']);
                var increase = (dayEnd[j]['confirmed'] - dayStart[j]['confirmed']) / dayStart[j]['estimated_population_2019'];
                increase = increase * 100;
                cityData = {
                    city: dayStart[j]['city'],
                    increase: increase,
                };

                arrayCities.push(cityData);
            }

            //console.log(arrayCities[0]);
            //arrayCities.sort((a, b) => (a.increase < b.increase) ? 1 : -1);
            arrayCities.sort((a, b) => {
                if(a.increase < b.increase){
                    return 1;
                }
                return -1;
            });

            for(i=0; i<10; i++){
                promCities.push(postData(i, arrayCities[i]));
            }
            
            Promise.all(promCities).then(() => {
                //console.log(arrayCities);
                res.send("OK");
            })
            .catch(error => {
                console.log("Error in finish promisses " + error)
            })          
        });
    }
    else{
        console.log(queryData);
        res.send("Missing parameter");
    }
});

// Para fazer o post http://codeheaven.io/how-to-use-axios-as-your-http-client-pt/
app.listen(8080, function(){
    console.log("Ouvindo na porta 8080");
});
