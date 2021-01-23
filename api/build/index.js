"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yelp_1 = require("./externalAPI/yelp");
require("dotenv").config();
const pg = require("pg-promise")();
const db = pg(`postgres://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));
const server = http.createServer(app);
const io = require("socket.io")(server);
const matches = require("./routes/matches");
app.get("/test", (req, res) => {
    res.send("Backend connected!");
});
app.get("/", (req, res) => {
    db.any(`SELECT * FROM users`).then((data) => {
        res.send(data[0].name);
    });
});
app.get('/users', (req, res) => {
    db.query('SELECT * FROM users')
        .then((data) => {
        res.send(data);
    })
        .catch((err) => console.log("user call error", err));
});
app.use('/matches', matches(db));
const port = process.env.PORT || 9000;
server.listen(port, () => {
    console.log("Server started listening on port " + port);
    let ansObj = {};
    let basket = {};
    io.on("connection", (socket) => {
        socket.on('disconnect', () => {
            for (const user in basket) {
                if (basket[user] = socket.id) {
                    basket[user] = "";
                    ansObj[user] = { yay: [], nay: [] };
                    console.log(`removed user ${user}`);
                }
            }
        });
        socket.on("new match session", (response) => {
            basket[response.user] = socket.id;
            console.log("starting new session");
            ansObj[response.user] = {
                yay: [],
                nay: [],
            };
            const restaurants = yelp_1.getRestaurantIdsWithFilter(response.category);
            restaurants.then((res) => {
                yelp_1.createRestaurantProfilesArr(res).then((res) => {
                    const resCopy = [...res];
                    yelp_1.shuffleArray(resCopy);
                    socket.emit("connection", resCopy);
                });
            });
            console.log(ansObj);
        });
        socket.on("answer", (ans) => {
            // THIS IS THE MATCHER LOGIC JOHN
            if (ans.ans === "yay") {
                for (const user in ansObj) {
                    if (ansObj[user]["yay"].includes(ans.restaurantPhone) && user !== ans.user.email) {
                        socket.broadcast.emit("match", ans.restaurant.name);
                        console.log(ans);
                        db.query('INSERT INTO matches (user_id, partner_id, restaurant) VALUES ($1, $2, $3);', [ans.user_id, ans.partner_id, ans.restaurantPhone])
                            .catch((err) => console.error('Match query error', err));
                        // send ans.user, user, ans.restaurant to DB as Match
                        break;
                    }
                }
                if (!ansObj[ans.user.email]["yay"].includes(ans.restaurantPhone))
                    ansObj[ans.user.email]["yay"].push(ans.restaurantPhone);
            }
            else {
                if (ansObj[ans.user.email]["yay"].includes(ans.restaurantPhone)) {
                    ansObj[ans.user.email]["yay"].splice(ansObj[ans.user.email]["yay"].indexOf(ans.restaurantPhone), 1);
                }
                ansObj[ans.user.email]["nay"].push(ans.restaurantPhone);
            }
            console.log(ansObj);
        });
        socket.on("reset", (user) => {
            socket.to(basket[user]).emit('resetCarousel', 'resetCarousel');
            ansObj[user] = { yay: [], nay: [] };
        });
        socket.on("change category", (response) => {
            const restaurants = yelp_1.getRestaurantIdsWithFilter(response.category);
            restaurants.then((res) => {
                yelp_1.createRestaurantProfilesArr(res).then((res) => {
                    socket.broadcast.emit("notify", response);
                    const resCopy = [...res];
                    yelp_1.shuffleArray(resCopy);
                    socket.emit("query response", resCopy);
                });
            });
        });
    });
});
/* const testorants =
[ { name: 'Dumpling House',
  image_url:
   'https://s3-media3.fl.yelpcdn.com/bphoto/BhSkksnrQr2XEriwIIsacQ/o.jpg',
  phone: '604-669-7769',
  address: '1719 Robson Street',
  city: 'Vancouver',
  rating: 4,
  price: '$$' },
{ name: 'Peaceful Restaurant',
  image_url:
   'https://s3-media2.fl.yelpcdn.com/bphoto/CEdKVbgadZV2Dyw71XGjAg/o.jpg',
  phone: '604-879-9878',
  address: '110-532 W Broadway',
  city: 'Vancouver',
  rating: 3.5,
  price: '$$' },
{ name: 'Bao Bei Chinese Brasserie',
  image_url:
   'https://s3-media3.fl.yelpcdn.com/bphoto/QmAy8YcOum-tJGTV6a_JKA/o.jpg',
  phone: '604-688-0876',
  address: '163 Keefer Street',
  city: 'Vancouver',
  rating: 4,
  price: '$$$' },
{ name: 'Chinatown BBQ',
  image_url:
   'https://s3-media1.fl.yelpcdn.com/bphoto/03HPbUeYbGtmxVUKdBEFjw/o.jpg',
  phone: '604-428-2626',
  address: '130 E Pender Street',
  city: 'Vancouver',
  rating: 4.5,
  price: '$$' },
{ name: 'Western Lake Chinese Seafood Restaurant',
  image_url:
   'https://s3-media1.fl.yelpcdn.com/bphoto/ICCU429pf1TanAnOlGGt2Q/o.jpg',
  phone: '604-321-6862',
  address: '4989 Victoria Drive',
  city: 'Vancouver',
  rating: 4,
  price: '$$' },
{ name: 'Sun Sui Wah Seafood Restaurant',
  image_url:
   'https://s3-media1.fl.yelpcdn.com/bphoto/SlhVR-v2ygyA913tZofcdw/o.jpg',
  phone: '604-872-8822',
  address: '3888 Main Street',
  city: 'Vancouver',
  rating: 3.5,
  price: '$$' },
{ name: 'ChongQing',
  image_url:
   'https://s3-media1.fl.yelpcdn.com/bphoto/jn99Vkgi4Gj3gxQAdWs29A/o.jpg',
  phone: '604-568-0303',
  address: '1260 Robson Street',
  city: 'Vancouver',
  rating: 4,
  price: '$$' },
{ name: 'New Town Bakery & Restaurant',
  image_url:
   'https://s3-media2.fl.yelpcdn.com/bphoto/mGYzDTGMquE3YxKBVSvJ2Q/o.jpg',
  phone: '604-681-1828',
  address: '148 Pender Street E',
  city: 'Vancouver',
  rating: 3.5,
  price: '$' },
{ name: 'Long\'s Noodle House',
  image_url:
   'https://s3-media2.fl.yelpcdn.com/bphoto/Dix7PSSxm_n3NmBpVz6gMA/o.jpg',
  phone: '604-879-7879',
  address: '4853 Main Street',
  city: 'Vancouver',
  rating: 3.5,
  price: '$$' },
{ name: 'Joojak Restaurant',
  image_url:
   'https://s3-media2.fl.yelpcdn.com/bphoto/tfHtHBhE865WwNabHAxVYw/o.jpg',
  phone: '604-563-8816',
  address: '3337 Kingsway',
  city: 'Vancouver',
  rating: 4.5,
  price: '$$' } ]
 */
