var mysql = require('mysql');
var inquirer = require('inquirer');

// Global variables that will change based on the customer input
var requestedItem;
var requestedQuantity;
var itemArray = [];
var cost;

// Constructor variable for item requested in store
function item(id, name, price, quantity, autograph){
	this.id = id;
	this.name = name;
	this.price = price;
	this.quantity = quantity;
	this.autograph = autograph;
}

// Creates variable connection to mysql
var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'root',
	database: 'bieBay'
});

connectin();

// Connects to mysql
function connectin () {
connection.connect(function (error, response) {
	if (error) {
		throw error;
	}
	else {
		introItems();
	}
});
};


// Initial menu to Geek Grove store. Shows items available for sale
function introItems () {

		//console.log("Connected to MySQL server, as ID = " + connection.threadId);
		connection.query("SELECT * FROM `bieBay`", function(err, response) {
			if (err) {
				console.log(err)
			}
			else {
				console.log('Hello! Welcome to the Geek Grove!');
				console.log("");
				console.log("Items available for sale: ");
				response.forEach(function (row) {
					console.log(row.item_id + ".) ", row.product_name, "................$" + row.price)
					
				})
			console.log("");
			customerOrder();
			}
		})

};

// Accepts customer order. Checks for a valid ID input. If valid, fires next function to ask for quantity.
function customerOrder () {
	inquirer.prompt([
		{
			type: 'input',
			message: 'Enter the ID number of the item you would like: ',
			name: 'id',
			validate: function(value){
				if (isNaN(value) === false && parseInt(value) > 0 && parseInt(value) <= 11) {
					return true;
				} else {
				console.log("");
				console.log("The item you have requested is unavailable. Please try entering another value.");
				return false;
			}
			}
		}
		]).then(function(answer) {
			requestedItem = answer.id;
			console.log("");
			console.log('Ok! Let me fetch that for you.');
			//console.log(requestedItem);
			orderQuantity();
		})
		
}

// Asks for desired quantity (must be a valid number). If valid, item is stored in a new variable. If the item is sold out, the customer is notified. If the customer selects a quantity greater than what is currently available, then the request is rejected and a new quantity is requested.
function orderQuantity () {
		inquirer.prompt([
		{
			type: 'input',
			message: 'Enter desired quantity: ',
			name: 'quantity',
			validate: function(value){
			if (isNaN(value) === false && parseInt(value) > 0) {
					return true;
				} else {
				console.log('');
				console.log('');
				console.log('Please enter a valid number.');
				console.log('');
				console.log('');
				return false;
			}
		}
		}
		]).then(function(answer) {
			requestedQuantity = answer.quantity; 
			//console.log(requestedQuantity);
			connection.query('SELECT * FROM `geekGrove` WHERE `item_id` ='+ requestedItem, function (error, response){
				if (error){
					console.log(error);

				}
				else {
					itemArray = [];
					//console.log(response[0].product_name);
					
					var newItem = new item (response[0].item_id, response[0].product_name, response[0].price, response[0].stock_quantity, response[0].autograph);
					//console.log(newItem);
					itemArray.push(newItem);
					//console.log(requestedQuantity);
					//console.log(itemArray[0].quantity);

					if (requestedQuantity <= itemArray[0].quantity) {
						console.log("");
						console.log('Yay! We can help you get your geek on! Order is a "go" for processing!')
						processOrder();


					}
					else if (itemArray[0].quantity <= 0){
						console.log("");
						console.log('Sorry, this item is currently out of stock! Check back with us another time.');
						nextOrder();
					}
					else {
						console.log("");
						console.log('Insufficient quantity. Try again.');
						console.log("");
						console.log('Currently we have '+ itemArray[0].quantity +' unit(s) of this item available.');
						console.log("");
						orderQuantity();
					}
					//processQuantity();

					
				}
				
			})
			console.log('')
		})
}

// Updates values of item in database. Confirms transaction for the customer.
function processOrder () {
	itemArray[0].quantity -= requestedQuantity;
	cost = requestedQuantity * itemArray[0].price;
	//console.log(itemArray[0].quantity);
	connection.query('UPDATE `bieBay` SET `stock_quantity` =' + itemArray[0].quantity + ' WHERE `item_id` =' + requestedItem, function (err, respone){
		if (err) {
			console.log(err);
			console.log('');
			console.log('Uh oh! Something went wrong. :(');
		}
		else {
			console.log('');
			console.log('Success! Your card has been charged: $' + cost);
			console.log('');
			console.log('Your product(s) will be mailed to the address on file.');
			console.log('');
			nextOrder();
		}
	})

}

// prompt to place another order.
function nextOrder () {
	inquirer.prompt([

	{
		type: 'confirm',
		message: 'Would you like to place another order?',
		name: 'confirm',
		default: true,
		validate: function(value){
			if (value == 'y' || value == 'n' || value == 'yes' || value == 'no') {
				return true;
			}
			else {
				return false;
			}
		}
	}
		]).then(function(answer) {
			if (answer.confirm === true) {
				console.log('');
				console.log('Great! Let's geek it up!);
				console.log('');
				console.log('');
				introItems();
			}
			else {
				console.log('');
				console.log("Sorry to see you go. Come see us again when you're ready to geek out!");
				console.log('');
			}
		})
}
