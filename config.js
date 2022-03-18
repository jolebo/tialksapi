const Pool = require('pg').Pool;
const AWS = require('aws-sdk');
const fs = require('fs');
const { resolve } = require('path');
const accessKeyId = "AKIAZDPMVULRHARIZ7VU";
const secretAccessKey = "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";

const pool = new Pool({
	user: 'postgres',
	host: 'localhost',
	database: 'belajaraws',
	password: 'admin',
	port: 5432
})

const s3 = new AWS.S3({
	accessKeyId: accessKeyId,
	secretAccessKey: secretAccessKey,
	// Bucket: "clientbuckettia"
});

const uploadFile = (fileName = '') => {
  fs.readFile(fileName, (err, data) => {
     if (err) throw err;
     const params = {
         Key: fileName, 
         Body: JSON.stringify(data, null, 2),
		 Bucket: "clientbuckettia"
     };
     s3.upload(params, function(s3Err, data) {
         if (s3Err) throw s3Err
         console.log(`File uploaded successfully at ${data.Location}`)
     });
  });
};

// get file from S3
const getFile = (fileName = '') => {
	return new Promise((resolve,params) => {
			const param = {
				Key: fileName,
				Bucket: "clientbuckettia"
			};
		 s3.getObject(param, (err, data) => {
			 if(err){
				 throw err;
			 }
			//  return data.Body;
			 resolve(data.Body);
		 });
	 })
}

const removeFile = (fileName = '') => {
	return new Promise((resolve,params) =>{
		const param = {
			Key: fileName,
			Bucket: "clientbuckettia"
		};
		s3.deleteObject(param, (err, data) => {
			 if(err){
				 throw err;
			 }
			 resolve(data);
		 });
	})
}

// input data to s3 
const inputFile = (fileName,file) => {
	return new Promise((resolve,params) =>{
		var data = {
			Key: fileName, 
			Body: file,
			ContentEncoding: 'base64',
			ContentType: 'image/jpeg',
			Bucket: "clientbuckettia"
		};
		s3.putObject(data, function(err, data){
			if (err) { 
			throw err;
			}
			resolve(data)
		});
	});
}

const getUsers = (request, response) => {
	pool.query('SELECT * FROM table_user',(error,results)=>{
		if(error){
			throw error
		}
		var rows = results.rows
		response.status(200).json(rows)
	})
}

const getByUsersId = (request, response) =>{
	const id = request.params.id;
	pool.query('SELECT * FROM table_user WHERE user_id = $1',[id],(error,results)=>{
		if(error){
			throw error;
		}

		response.status(200).json(results.rows)
	})
}

const convertBuffer = (base64) => {
	return Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ""),'base64');
}

const insertUser = (request, response) => {
	const {user_id,user_nama, user_alamat} = request.body;
	const base64 = convertBuffer(request.body.user_photo);
	const fileName =  gen_id(10)+'.jpg';
	inputFile(fileName,base64);

	pool.query("INSERT INTO table_user values($1,$2,$3,$4)",[gen_id(),user_nama, user_alamat, fileName],(error,results)=>{
		if(error){
			throw error;
		}

		response.status(201).send({
			message: `Successfully added user ${user_nama}`
		});
	})
}

const updateUser = (request,response) => {
	const user_id = request.params.id;
	const {user_nama, user_alamat} = request.body;

	pool.query('SELECT * FROM table_user WHERE user_id = $1',[user_id],(err,results)=>{
		if(err){
			throw err;
		}
		// hapus file di s3
		removeFile(results.rows[0].user_photo);
		// convert bas64
		const base64 = convertBuffer(request.body.user_photo);
		const fileName =  gen_id(10)+'.jpg';
		// masukkan ke s3 lagi
		inputFile(fileName,base64);
		pool.query('UPDATE table_user SET user_nama = $1, user_alamat = $2, user_photo = $3 WHERE user_id = $4 ',[user_nama,user_alamat,fileName,user_id],(error,results) => {
			if(error){
				throw error;
			}
			response.status(201).send({
				message:`Successfully update user ${user_nama}`
			});
		})
	})
}

const deleteUser = (request,response) => {
	const id = request.params.id;
	pool.query('SELECT * FROM table_user WHERE user_id = $1',[id],(err,results)=>{
		if(err){
			throw err;
		}
		removeFile(results.rows[0].user_photo);
		pool.query('DELETE FROM table_user WHERE user_id = $1',[id],(error,res) => {
			if(error){
				throw error;
			}
			response.status(200).send({
				message: `Successfully delete user ${results.rows[0].user_nama}`
			});
		})
	})
}

const gen_id = (length = 32) => {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

module.exports = {
	getUsers,
	getByUsersId,
	insertUser,
	updateUser,
	deleteUser,
	uploadFile,
	getFile
}