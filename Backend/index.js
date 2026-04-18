const express =require ('express');
const app = express();
const port = 8080;
const path = require('path');

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.render('home');
});

app.get('/home', (req, res) => {
    res.render('home');
});

app.get('/dashboard', (req, res) => {
    res.render('home');
});

app.get('/get-started', (req, res) => {
    res.render('get-started');
});

app.get('/dashboard/get-started', (req, res) => {
    res.render('get-started');
});

// NGO Routes
app.get('/ngo/signup', (req, res) => {
    res.render('ngo-signup');
});

app.get('/ngo/login', (req, res) => {
    res.render('ngo-login');
});

// Single User Routes
app.get('/user/signup', (req, res) => {
    res.render('user-signup');
});

app.get('/user/login', (req, res) => {
    res.render('user-login');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});