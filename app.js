// import Sequelize
const Sequelize = require("sequelize");

// init connection
const sequelize = new Sequelize(
    "tugas_soa", "root", "", {
        host: "localhost",
        port: 3306,
        dialect: "mysql",
        logging: true
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
    await sequelize.sync({force: true})
    // seed database
    await User.bulkCreate(userSeed)
})()
