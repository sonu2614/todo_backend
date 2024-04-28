Todo 
This project is an Express server with MongoDB integration, featuring various APIs for user registration, login, and a todo dashboard.

Setup
    1. Install dependencies:npm install
    2. Start the server:npm start
    3. Access the application at http://localhost:8000

MongoDB Connection
Ensure you have MongoDB installed and running locally. Update the connection string in config.js with your MongoDB URI.

APIs
Register Page
    . Endpoint: /register
    . Method: POST
    . Description: Register a new user.
    . Parameters:
        . username: User's username
        . password: User's password.


Login Page
    Endpoint: /login
    Method: POST
    Description: Log in with existing credentials.
    Parameters:
        username: User's username
        password: User's password


Dashboard Page
    Endpoint: /dashboard
    Method: GET
    Description: View user's dashboard (Todo Page).

Logout
    Endpoint: /logout
    Method: GET
    Description: Logout the currently logged-in user.

Logout from all devices
    Endpoint: /logout/all
    Method: GET
    Description: Logout the user from all devices.

Todo APIs
    Create Todo
    Endpoint: /todo/create
    Method: POST
    Description: Create a new todo item.
    Parameters:
        title: Title of the todo
        description: Description of the todo


Read Todo
    Endpoint: /todo/read
    Method: GET
    Description: Get all todo items for the logged-in user.


Edit Todo
    Endpoint: /todo/edit/:id
    Method: PUT
    Description: Edit a todo item.  
    Parameters:
        id: ID of the todo to be edited
        title: New title of the todo
        description: New description of the todo

Delete Todo
    Endpoint: /todo/delete/:id
    Method: DELETE
    Description: Delete a todo item.
    Parameters:
        id: ID of the todo to be deleted


Pagination API
    Endpoint: /todo/page/:pageNumber
    Method: GET
    Description: Get todo items with pagination.

Rate Limiting
    Rate limiting is implemented to prevent abuse of APIs. Exceeding the limit will result in appropriate error responses.

EJS View Engine
    EJS is set as the view engine for Express, allowing dynamic rendering of HTML pages.


Session-based Authentication
    Session-based authentication is implemented to secure user endpoints and ensure only authenticated users can access certain routes.

Axios
    Axios is utilized for making HTTP requests to the server, enabling CRUD operations on todos from the client side.

Read Component
    A Read Component is provided for displaying todo items fetched from the server.


