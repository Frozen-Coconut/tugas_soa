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
        underscored:true,
        tableName: "users",
        name: {
            singular: "User",
            plural: "User"
        }
    }
)

// init database
const {userSeed} = require("./dbseed");
(async () => {
    let temp = undefined
    // sync model with database
    await sequelize.sync({force: false})
    // seed database
    await User.bulkCreate(userSeed)
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
        return res.status(404).json({message: "Username tidak terdaftar!"})
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
        return res.status(404).json({message: "Username tidak terdaftar!"})
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

// run express
app.listen(3000, () => {
    console.log("Server started at http://localhost:3000")
})
