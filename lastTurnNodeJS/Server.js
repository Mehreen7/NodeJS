const express = require("express");
const fs = require('fs');
const app = express();
const bodyParser = require("body-parser");
var uuid = require('uuid-random');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use((req, res, next) => 
{
  res.header('Access-Control-Allow-Origin', '*');

  // authorized headers for preflight requests
  // https://developer.mozilla.org/en-US/docs/Glossary/preflight_request
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();

  app.options('*', (req, res) =>
  {
      // allowed XHR methods  
      res.header('Access-Control-Allow-Methods', 'GET, PATCH, PUT, POST, DELETE, OPTIONS');
      res.send();
  });
});
// connexion pool
var multer = require('multer');
const { Pool } = require("pg");

const pool = new Pool(
  {
    user: "postgres",
    host: "localhost",
    database: "postgres",
    password: "monserveur",
    port: 5432
  });
  console.log("Connexion réussie à la base de données");

app.listen(3000, () => 
{
  console.log("Serveur démarré (http://localhost:3000/)");
});

var storage = multer.diskStorage(
{
  destination: function(req, file, cb) 
    {
      cb(null, './images');
    },
    filename: function (req, file, cb) 
    {
      cb(null , file.originalname);
    }
});
var upload = multer({ storage: storage })

// POST upload d'une image
app.post("/addDocument",upload.single('image'),(req,res)=>
{
try
{
  date=new Date();
  titre=uuid();
  id_piece=req.query.id_piece;
  w1g_file_path_ftp="/images/"+titre;
  const sql = "INSERT INTO documents (date, titre,w1g_file_path_ftp,id_piece ) VALUES ($1, $2, $3,$4)";
  const document = [date, titre, w1g_file_path_ftp, id_piece];
  pool.query(sql, document, (err, result) => 
  {
    if (err) 
    {
      return console.error(err.message);
    }
      res.send("files: "+req.file);
  })
} catch (error) 
  {
    console.log(error);
    res.send(400);
  }
});

// POST ajout d'une liste d'image
app.post("/addDocuments",upload.array('documents', 4),(req,res)=>{

    try {
   req.files.forEach(file => {

    date=new Date();
    titre=req.body.titre;
    w1g_file_path_ftp="/images/"+titre;

    const sql = "INSERT INTO documents (date, titre,w1g_file_path_ftp ) VALUES ($1, $2, $3)";
  const documents = [date, titre, w1g_file_path_ftp];
  pool.query(sql, documents, (err, result) => {
    if (err) {
        return console.error(err.message);
      }

      res.send("files: "+req.files+"\n"+"enregistrement : "+result.rows);
  });
   });
    } catch(error) {
          console.log(error);
           res.send(400);
    }
})

// GET récupération de toutes les images
app.get("/allDocuments", (req, res) => {
 
    const sql = "SELECT * FROM documents";
    pool.query(sql, [], (err, result) => {
      if (err) {
        return console.error(err.message);
      }
      //console.log("resultat",result)
     res.send(result.rows);
    });
});

// GET récupération de toutes les images
app.get("/allDocumentsbypiece/:idpiece", (req, res) => {
  const idpiece = req.params.idpiece;
  console.log(idpiece);
  const sql = "SELECT * FROM documents where id_piece = $1";
  pool.query(sql, [idpiece], (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    console.error('COUCOU : ');
    console.error(result.rows);
   res.send(result.rows);
  });
});








// GET récupération d'une image
app.get("/oneDocument/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM documents WHERE id = $1";
    pool.query(sql, [id], (err, result) => {
        if (err) {
            return console.error(err.message);
          }

          res.send(result.rows);
    });
  });

// POST mise à jour d'une image
  app.post("/updateDocument/:id", (req, res) => {
    const id = req.params.id;
    // console.log("id",req.params.id)
    // console.log("body",req.body);
    const document = [req.body.date, req.body.titre, req.body.w1g_file_path_ftp, id];
    const sql = "UPDATE documents SET date = $1, titre = $2, w1g_file_path_ftp = $3 WHERE (id = $4)";
    pool.query(sql, document, (err, result) => {
        if (err)
        {
            return console.error(err.message);
        }
      res.send(result)
    });
  });

// GET suppression d'une image 
  app.get("/deleteDocument/:id", (req, res) => {
    const id = req.params.id;
    const sql = "DELETE  FROM documents WHERE id = $1";
    pool.query(sql, [id], (err, result) => {
        if (err) {
            return console.error(err.message);
          }
      res.render("delete", { model: result.rows[0] });
    });
  });

  // GET chargement d'une image 
 /* app.get("/getImage",(req,res)=>{

  const filePath="images/"+req.params.chemin;
  console.log(filePath);


  });*/
  app.get("/getImage/:chemin",(req,res)=>{
    const filePath="images/"+req.params.chemin;
    console.log(filePath);
    fs.exists(filePath, function(exists){
      if (exists) {     
        // Content-type is very interesting part that guarantee that
        // Web browser will handle response in an appropriate manner.
        res.writeHead(200, {
          "Content-Type": "application/octet-stream",
         // "Content-Disposition": "attachment; filename=" + req.params.chemin
         "Content-Disposition":"inline"
        });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(400, {"Content-Type": "text/plain"});
        res.end("ERROR File does not exist");
      }
    });
  })



  // GET récupération de la liste des pièces
  app.get("/listepieces",(req,res)=>{
    const sql ="SELECT * FROM pieces"
    pool.query(sql, [],(err,result) => {
      if(err) {
        return console.error(err.message);
      }
      console.log("resultat", result)
      res.send(result.rows);
    });
  });

    // GET récupération de la liste des équipement
    app.get("/listeequip",(req,res)=>{
      const sql ="SELECT * FROM equipements"
      pool.query(sql, [],(err,result) => {
        if(err) {
          return console.error(err.message);
        }
        console.log("resultat", result)
        res.send(result.rows);
      });
    });

//  https://www.codespeedy.com/display-local-image-in-node-js-express-js/