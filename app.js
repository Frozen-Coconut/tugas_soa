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
            allowNull: true
        },
        alamat: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        nomorhp: {
            type: DataTypes.STRING(255),
            allowNull: true
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

// init database
const {userSeed, friendSeed} = require("./dbseed");
(async () => {
    let temp = undefined
    // sync model with database
    await sequelize.sync({force: false})
    // seed database
    await User.bulkCreate(userSeed)
    await Friend.bulkCreate(friendSeed)
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

// run express
app.listen(3000, () => {
    console.log("Server started at http://localhost:3000")
})
