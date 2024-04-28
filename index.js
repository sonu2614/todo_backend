const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const clc = require('cli-color')
const bcrypt = require('bcrypt')
const validator = require('validator')
const session = require("express-session");
const mongoDbsession = require("connect-mongodb-session")(session);

//file import
const { userDataValidation } = require("./utils/authUtil");
const userModel = require("./models/userModel");
const todoModel = require("./models/todoModel")
const { isAuth } = require('./middlewares/authMiddleware')

//constant
const app = express();
const PORT = process.env.PORT;
const store = new mongoDbsession({
    uri: process.env.MONGO_URI,
    collection: "sessions",
});

//middleware
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }))
app.use(express.json());
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store: store
}));
app.use(express.static("public"));

//Db connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log(clc.yellowBright.bold("MongoDb connected successfully"));
    })
    .catch((err) => {
        console.log(clc.redBright(err));
    });

//api
app.get("/", (req, res) => {
    // return res.send("TODO App Server is running");
    return res.render("firstPage.ejs")
});
app.get('/register', (req, res) => {
    //return res.send("Register Page");
    return res.render("registerPage.ejs")
})
app.post("/register", async (req, res) => {
    //console.log(req.body);

    const { name, email, username, password } = req.body;

    //data validation
    try {
        await userDataValidation({ name, email, username, password });
    } catch (error) {
        return res.send({
            status: 400,
            message: "User data error",
            error: error,
        });
    }
    //check if email and username already exist or not
    const userEmailExist = await userModel.findOne({ email });
    // console.log(userEmailExist);
    if (userEmailExist) {
        return res.send({
            status: 400,
            message: "Email Already exist",
        })
    }

    const userUsernameExist = await userModel.findOne({ username })
    if (userUsernameExist) {
        return res.send({
            status: 400,
            message: "Username Already exist",
        })
    }

    //hashed password
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.SALT))
    // console.log(hashedPassword);

    //store the data in DB
    const userObj = new userModel({
        //schema :client
        name: name,
        email: email,
        username: username,
        password: hashedPassword,
    })

    try {
        const userDB = await userObj.save()
        // return res.send({
        //     status: 201,
        //     message: "Registeration Successfull",
        //     data: userDB
        // })
        return res.redirect("/login");
    } catch (error) {
        return res.send({
            status: 500,
            message: "DataBase error",
            error: error
        });

    }
});


app.get('/login', (req, res) => {
    //return res.send("Login Page")
    return res.render("loginPage")
})
app.post('/login', async (req, res) => {
    // console.log(req.body);

    const { loginId, password } = req.body;

    if (!loginId || !password) {
        return res.send({
            status: 400,
            message: "Missing credentails"
        });
    }

    //find the user from DB with loginId
    try {
        let userDb;
        if (validator.isEmail(loginId)) {
            userDb = await userModel.findOne({ email: loginId });
        } else {
            userDb = await userModel.findOne({ username: loginId });
        }


        if (!userDb) {
            return res.send({
                status: 400,
                message: "User not found, please register",
            });
        }
        //compare the password
        // console.log(password, userDb.password);

        const isMatched = await bcrypt.compare(password, userDb.password);

        if (!isMatched) {
            return res.send({
                status: 400,
                message: "Password does not matched",
            });
        }

        //session base auth
        // console.log(req.session, req.session.id);
        req.session.isAuth = true;
        req.session.user = {
            userId: userDb._id,
            email: userDb.email,
            username: userDb.username,
        };

        // return res.send({
        //     status: 200,
        //     message: "Login Succes"
        // })
        return res.redirect("/dashboard")

    } catch (error) {
        return res.send({
            status: 500,
            message: "Database error",
            error: error,
        })
    }

    //return res.send("Login successfull")
})

app.get("/dashboard", isAuth, (req, res) => {
    return res.render("dashboardPage")



    // console.log(req.session);
    // if(req.session.isAuth){
    //     return res.send("Dashboard Page")
    // }else{
    //     return res.send("session expired")
    // }
})

app.post("/logout", isAuth, (req, res) => {
    // id = req.session.id
    // sessionModel.findOneAndDelete({_id : id})
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json("Logout unsuccessfull")
        } else {
            return res.status(200).redirect("/login")
        }
    })
})

app.post("/logout_from_all_devices", isAuth, async (req, res) => {
    // console.log(req.session.user.username);
    const username = req.session.user.username;

    //session Schema
    const sessionSchema = new mongoose.Schema({ _id: String }, { strict: false });
    const sessionModel = mongoose.model('session', sessionSchema);

    try {
        const deleteDb = await sessionModel.deleteMany({ "session.user.username": username, });
        // console.log(deleteDb);

        return res.status(200).redirect("/login")

    } catch (error) {
        return res.status(500).redirect("/login")
    }

    return res.send("All ok")
})

//TODO API's

app.post("/create-item", isAuth, async (req, res) => {
    //todoText, username
    const todoText = req.body.todo;
    const username = req.session.user.username;

    //data validation
    if (!todoText) {
        return res.status(400).json("Missing todo text.");
    } else if (typeof todoText !== "string") {
        return res.status(400).json("Todo is not a text");
    } else if (todoText.length < 3 || todoText.length > 200)
        return res.send({
            status: 400,
            message: "Todo length should be 3-200",
        });

    const todoObj = new todoModel({
        todo: todoText,
        username: username,
    });

    try {
        const todoDb = await todoObj.save();
        return res.send({
            status: 201,
            message: "Todo created successfully",
            data: todoDb,
        });
    } catch (error) {
        return res.send({
            status: 500,
            message: "Database error",
            error: error,
        });
    }
});

// app.get('/read-item', isAuth, async (req, res) => {
//     //id todo, username
//     const username = req.session.user.username;
//     try {
//         const todos = await todoModel.find({ username });

//         if (todos.length === 0) {
//             return res.send({
//                 status: 400,
//                 message: "No Todos Found"
//             });
//         }
//         return res.send({
//             status: 200,
//             message: "Read Success",
//             data: todos,
//         })
//     } catch (error) {
//         return res.send({
//             status: 500,
//             message: "Database error",
//             error: error,
//         })
//     }
// })
app.get("/read-item", isAuth, async (req, res) => {
    const username = req.session.user.username;
    const SKIP = Number(req.query.skip) || 0;
    const LIMIT = 5;

    //mongodb agggregate, skip, limit, match
    try {
        const todos = await todoModel.aggregate([
            {
                $match: { username: username },
            },
            {
                $facet: {
                    data: [{ $skip: SKIP }, { $limit: LIMIT }],
                },
            },
        ]);

        if (todos[0].data.length === 0) {
            return res.send({
                status: 400,
                message: SKIP === 0 ? "No todos found" : "No more todos",
            });
        }

        // console.log(todos[0].data);
        return res.send({
            status: 200,
            message: "Read success",
            data: todos[0].data,
        });
    } catch (error) {
        return res.send({
            status: 500,
            message: "Database error",
            error: error,
        });
    }
});

//edit
app.post("/edit-item", isAuth, async (req, res) => {
    //id, todo, username
    const { id, newData } = req.body;
    const username = req.session.user.username;

    //find the todo

    try {
        const todoDb = await todoModel.findOne({ _id: id });

        if (!todoDb)
            return res.send({
                status: 400,
                message: "Todo not found",
            });

        //check the ownership
        if (username !== todoDb.username)
            return res.send({
                status: 403,
                message: "Not authorized to edit the todo",
            });

        const prevTodo = await todoModel.findOneAndUpdate(
            { _id: id },
            { todo: newData } // {key1 : val1, key2:val2}
        );

        return res.send({
            status: 200,
            message: "Todo edited successfully",
            data: prevTodo,
        });
    } catch (error) {
        return res.send({
            status: 500,
            message: "Database error",
            error: error,
        });
    }
});

//delete
app.post("/delete-item", isAuth, async (req, res) => {
    const id = req.body.id;
    const username = req.session.user.username;

    if (!id)
        return req.status(400).json("Missing Todo id");
    //find, compare, delete
    try {
        const todoDb = await todoModel.findOne({ _id: id });
        if (!todoDb)
            return res.status(404).json(`Todo not found with id :${id}`);

        if (todoDb.username !== username)
            return res.status(403).json("Not allow to delete, authorization failed");

        const deletedTodo = await todoModel.findOneAndDelete({ _id: id })

        return res.send({
            status: 200,
            message: "Todo deleted successfully",
            data: deletedTodo
        })
    } catch (error) {
        return res.send({
            status: 500,
            message: "Database error",
            error: error,
        })
    }
})


app.listen(8000, () => {
    console.log(clc.yellow(`Server is running on `));
    console.log(clc.yellow.underline(`http://localhost:${PORT}`));
});