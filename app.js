const express = require('express');
const bodyparser = require('body-parser');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

const port = process.env.PORT || 8000;
const app = express();

app.use(bodyparser.json());
app.use(express.static(path.join(__dirname, 'publics')));

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    connectTimeout: 10000,
    queueLimit: 0
})

let formatInput = (data) => {
    let parsedAmount = parseFloat(data.amount);
    let finalAmount = isNaN(parsedAmount) ? 0 : parsedAmount;
    return {
        transaction_date: new Date(data.transaction_date),
        amount: finalAmount,
        action_type: data.action_type,
        note: data.note ? data.note : ""
    };
}

let validateInput = (data) => {
    let errors = [];

    if(!data.transaction_date){
        errors.push('กรุณาระบุวันที่ทำธุรกรรม');
    }else if(isNaN(Date.parse(data.transaction_date))){
        errors.push('รูปแบบวันที่ไม่ถูกต้อง');
    }

    if(!data.amount || isNaN(data.amount)){
        errors.push('กรุณากรอกจำนวนเงินเป็นจำนวนเต็มหรือทศนิยม');
    }else if(data.amount <= 0){
        errors.push('จำนวนเงินต้องมากกว่า 0 บาท');
    }

    if(!data.action_type){
        errors.push('กรุณาระบุประเภทธุรกรรม');
    }else if(data.action_type !== 'deposit' && data.action_type !== 'withdraw'){
        errors.push('ประเภทธุรกรรมมีแค่ deposit (ฝากเงิน) และ withdraw (ถอนเงิน) เท่านั้น');
    }

    return {
        isValid: errors.length === 0,
        errorMessage: errors
    };
}

app.get('/transaction/', async (req, res) => {
    try{
        const [result] = await db.query('SELECT * FROM transactions;');
        res.status(200).json(result);
    }catch (error){
        console.log('error: ', error.code);
        console.log(error.message);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดที่เซิฟเวอร์'
        });
    }
});

app.post('/transaction/', async (req, res) => {
    try{
        let transaction = formatInput(req.body);
        let validation = validateInput(transaction);
    
        if(!validation.isValid){
            const errors = new Error('ข้อมูลไม่ถูกต้อง');
            errors.customErrors = validation.errorMessage
            errors.statusCode = 400;
            throw errors;
        }
    
        const [result] = await db.query(
            'INSERT INTO transactions (transaction_date, amount, action_type, note) VALUES (?, ?, ?, ?)',
            [transaction.transaction_date, transaction.amount, transaction.action_type, transaction.note]
        );
    
        res.status(200).json({
            success: true,
            message: 'INSERT SUCCESS'
        });
    }catch(error){
        console.log('เกิดข้อผิดพลาด:', error.message);
        console.log('customErrors:', error.customErrors);

        let statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: 'false',
            message: error.message || 'Something went wrong.',
            errors: error.customErrors || []
        })
    }
});

app.put('/transaction/:id', async (req, res) => {
    try{
        let id = req.params.id;
        let updateTransaction = formatInput(req.body);
        let validation = validateInput(updateTransaction);

        if(!validation.isValid){
            const errors = new Error('ข้อมูลไม่ถูกต้อง');
            errors.customErrors = validation.errorMessage;
            errors.statusCode = 400;
            throw errors;
        }
        const [result] = await db.query(`
            UPDATE transactions
            SET transaction_date = ?, amount = ?, action_type = ?, note = ?
            WHERE id = ?
            `,
            [updateTransaction.transaction_date, updateTransaction.amount, updateTransaction.action_type, updateTransaction.note, id]
        );
        if(result.affectedRows === 0){
            const error = new Error(`ไม่พบผู้ใช้ ID: ${id}`);
            error.statusCode = 400;
            throw error;
        }

        res.status(200).json({
            success: true,
            message: 'UPDATE SUCCESS'
        })
    }catch(error){
        console.log('เกิดข้อผิดพลาด:', error.message);
        console.log('customErrors:', error.customErrors);

        let statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            sucess: 'false',
            message: error.message || 'Something went wrong.',
            errors: error.customErrors || []
        });
    }
});

app.delete('/transaction/:id', async (req, res) => {
    try{
        let id = req.params.id;
        const [result] = await db.query('DELETE FROM transactions WHERE id = ?', [id]);
        if(result.affectedRows === 0){
            const errors = new Error(`ไม่พบผู้ใช้ ID: ${id}`);
            errors.statusCode = 400;
            throw errors;

        }
        res.status(200).json({
            success: true,
            message: 'DELETE SUCCESS'
        })
    }catch(error){
        console.log(error.message);
        let statusCode = error.statusCode;
        res.status(statusCode).json({
            sucess: 'false',
            message: error.message || 'Something went wrong.',
            errors: error.customErrors || []
        });
    }
});

app.listen(port, (req, res) => {
    console.log(`Listen on http://localhost:${port}`);
});