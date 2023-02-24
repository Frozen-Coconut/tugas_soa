// import Sequelize
const Sequelize = require("sequelize");

// init connection
const sequelize = new Sequelize(
    "tugas_soa", "root", "", {
        host: "localhost",
        port: 3306,
        dialect: "mysql",
        logging: false
    }
)

// get some needed classes
const {Model, DataTypes, Op} = Sequelize

// init User model
class User extends Model {}
User.init(
    {
        username: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        nama: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        alamat: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        nomorhp: {
            type: DataTypes.STRING(255),
            allowNull: false
        }
    },
    {
        sequelize,
        paranoid: true,
        underscored: true,
        tableName: "users",
        name: {
            singular: "User",
            plural: "User"
        }
    }
)

// init Friend model
class Friend extends Model {}
Friend.init(
    {
        username: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        target: {
            type: DataTypes.STRING(255),
            allowNull: false
        }
    },
    {
        sequelize,
        paranoid: false,
        underscored: true,
        tableName: "friends",
        name: {
            singular: "Friend",
            plural: "Friend"
        }
    }
)

// init Message model
class Message extends Model {}
Message.init(
    {
        from: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        to: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        message: {
            type: DataTypes.STRING(1023),
            allowNull: false
        }
    },
    {
        sequelize,
        paranoid: false,
        underscored: true,
        tableName: "messages",
        name: {
            singular: "Message",
            plural: "Message"
        }
    }
)

// init database
const {userSeed, friendSeed} = require("./dbseed");
(async () => {
    let temp = undefined
    // sync model with database
    await sequelize.sync({force: false})
    // seed database
    if (await User.count() == 0) {
        await User.bulkCreate(userSeed)
    }
    if (await Friend.count() == 0) {
        await Friend.bulkCreate(friendSeed)
    }
})()

// import express
const Express = require("express")

// init express
const app = Express()
app.use(Express.urlencoded({extended: true}))

// init register route
app.post("/api/user", async (req, res) => {
    let {username, password, nama, alamat, nomorhp} = req.body
    if (!username || !password || !nama || !alamat || !nomorhp) {
        return res.status(400).json({message: "Body tidak sesuai ketentuan!"})
    }
    let user = await User.findOne({where: {username: username}})
    if (!user) {
        User.create({
            username: username,
            password: password,
            nama: nama,
            alamat: alamat,
            nomorhp: nomorhp
        })
        return res.status(201).json({message: "Berhasil registrasi user!"})
    }
    return res.status(400).json({message: "Username sudah terpakai!"})
})

// init login route
app.post("/api/login", async (req, res) => {
    let {username, password} = req.body
    if (!username || !password) {
        return res.status(400).json({message: "Body tidak sesuai ketentuan!"})
    }
    let user = await User.findOne({where: {username: username}})
    if (!user) {
        return res.status(401).json({message: "Username tidak terdaftar!"})
    }
    if (password != user.password) {
        return res.status(401).json({message: "Password salah!"})
    }
    return res.status(200).json({message: "Berhasil login!"})
})

// init edit profile route
app.put("/api/user/:username", async (req, res) => {
    let username = req.params.username
    let {nama, alamat, nomorhp, oldpassword, newpassword} = req.body
    if (!nama || !alamat || !nomorhp || !oldpassword || !newpassword) {
        return res.status(400).json({message: "Body tidak sesuai ketentuan!"})
    }
    let user = await User.findOne({where: {username: username}})
    if (!user) {
        return res.status(401).json({message: "Username tidak terdaftar!"})
    }
    if (oldpassword != user.password) {
        return res.status(401).json({message: "Password salah!"})
    }
    user.nama = nama
    user.alamat = alamat
    user.nomorhp = nomorhp,
    user.password = newpassword
    user.save()
    return res.status(200).json({message: "Behasil mengedit user!"})
})

// init add friend route
app.post("/api/friend", async (req, res) => {
    let {username, password, usercari} = req.body
    if (!username || !password || !usercari) {
        return res.status(400).json({message: "Body tidak sesuai ketentuan!"})
    }
    let user = await User.findOne({where: {username: username}})
    if (!user) {
        return res.status(401).json({message: "Username tidak terdaftar!"})
    }
    if (password != user.password) {
        return res.status(401).json({message: "Password salah!"})
    }
    let target = await User.findOne({where: {username: usercari}})
    if (!target) {
        return res.status(404).json({message: "Usercari tidak ditemukan!"})
    }
    Friend.create({
        username: username,
        target: usercari
    })
    return res.status(201).json({message: "Berhasil menambah teman!"})
})

// init view friend route
app.get("/api/friend/:username", async (req, res) => {
    let username = req.params.username
    let password = req.body.password
    if (!password) {
        return res.status(400).json({message: "Body tidak sesuai ketentuan!"})
    }
    let user = await User.findOne({where: {username: username}})
    if (!user) {
        return res.status(401).json({message: "Username tidak terdaftar!"})
    }
    if (password != user.password) {
        return res.status(401).json({message: "Password salah!"})
    }
    let friends = await Friend.findAll({where: {username: username}})
    let result = {}
    for (let friend of friends) {
        let temp = await User.findOne({where: {username: friend.target}})
        result[temp.username] = {
            nama: temp.nama,
            alamat: temp.alamat,
            nomorhp: temp.nomorhp
        }
    }
    return res.status(200).json(result)
})

// init delete friend route
app.delete("/api/friend", async (req, res) => {
    let {username, password, usercari} = req.body
    if (!username || !password || !usercari) {
        return res.status(400).json({message: "Body tidak sesuai ketentuan!"})
    }
    let user = await User.findOne({where: {username: username}})
    if (!user) {
        return res.status(401).json({message: "Username tidak terdaftar!"})
    }
    if (password != user.password) {
        return res.status(401).json({message: "Password salah!"})
    }
    let target = await User.findOne({where: {username: usercari}})
    if (!target) {
        return res.status(404).json({message: "Usercari tidak ditemukan!"})
    }
    await Friend.destroy({where: {username: username, target: usercari}})
    return res.status(200).json({message: "Berhasil menghapus teman!"})
})

// init send message route
app.post("/api/message", async (req, res) => {
    let {username, password, usercari, message} = req.body
    if (!username || !password || !usercari || !message) {
        return res.status(400).json({message: "Body tidak sesuai ketentuan!"})
    }
    let user = await User.findOne({where: {username: username}})
    if (!user) {
        return res.status(401).json({message: "Username tidak terdaftar!"})
    }
    if (password != user.password) {
        return res.status(401).json({message: "Password salah!"})
    }
    let target = await User.findOne({where: {username: usercari}})
    if (!target) {
        return res.status(404).json({message: "Usercari tidak ditemukan!"})
    }
    let friend = await Friend.findOne({where: {username: username, target: usercari}})
    if (!friend) {
        return res.status(401).json({message: "Usercari belum ditambahkan sebagai teman!"})
    }
    Message.create({
        from: username,
        to: usercari,
        message: message
    })
    return res.status(201).json({message: "Berhasil mengirim pesan!"})
})

// init view message route
app.get("/api/message/:username", async (req, res) => {
    let username = req.params.username
    let password = req.body.password
    if (!username || !password) {
        return res.status(400).json({message: "Body tidak sesuai ketentuan!"})
    }
    let user = await User.findOne({where: {username: username}})
    if (!user) {
        return res.status(401).json({message: "Username tidak terdaftar!"})
    }
    if (password != user.password) {
        return res.status(401).json({message: "Password salah!"})
    }
    let messages = await Message.findAll({where: {from: username}})
    return res.status(200).json(messages)
})

// run express
app.listen(3000, () => {
    console.log("Server started at http://localhost:3000")
})
