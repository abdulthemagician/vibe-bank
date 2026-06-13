const transactionDateInput = document.getElementById('transaction-date-input');
const amountInput = document.getElementById('amount-input');
const noteInput = document.getElementById('note-input');
const actionInput = document.getElementById('action-input');
const editTransactionId = document.getElementById('edit-transaction-id');
const API_URL = 'http://zeppeli.local:8000/transaction';
const totalBalanceDisplay = document.getElementById('total-balance');

let currentBalance = 0.0;

const validateInput = (transaction) => {
    let errors = [];

    if(!transaction.transaction_date){
        errors.push('กรุณาระบุวันที่ทำธุรกรรม');
    }else if(isNaN(Date.parse(transaction.transaction_date))){
        errors.push('รูปแบบวันที่ไม่ถูกต้อง');
    }

    if(!transaction.amount || isNaN(transaction.amount)){
        errors.push('กรุณากรอกจำนวนเงินเป็นจำนวนเต็มหรือทศนิยม');
    }else if(transaction.amount <= 0){
        errors.push('จำนวนเงินต้องมากกว่า 0 บาท');
    }

    if(!transaction.action_type){
        errors.push('กรุณาระบุประเภทธุรกรรม');
    }else if(transaction.action_type !== 'deposit' && transaction.action_type !== 'withdraw'){
        errors.push('ประเภทธุรกรรมมีแค่ deposit (ฝากเงิน) และ withdraw (ถอนเงิน) เท่านั้น');
    }

    return {
        isValid: errors.length === 0,
        errorMessage: errors
    };
}

const timeOption = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
}

const toISOTimeString = (date = new Date()) => {
    const temp = {
        'day': String(date.getDate()).padStart(2, '0'),
        'month': String(date.getMonth() + 1).padStart(2, '0'),
        'year': String(date.getFullYear()),
        'hour': String(date.getHours()).padStart(2, '0'),
        'minute': String(date.getMinutes()).padStart(2, '0')
    }
    return `${temp.year}-${temp.month}-${temp.day}T${temp.hour}:${temp.minute}`;
}

const updateTransactionDateInput = () => {
    transactionDateInput.value = toISOTimeString();
}

const updateBalance = () => {
    totalBalanceDisplay.textContent = currentBalance;
}

const tableBody = document.getElementById('table-body');
const fetchTransaction = async () => {
    try{
        const response = await axios.get(API_URL);
        const transactions = response.data;
        tableBody.innerHTML = '';
        currentBalance = 0;
        transactions.forEach((transaction) => {
            const tableRow = document.createElement('tr');
            const transaction_date = document.createElement('td');
            const amount = document.createElement('td');
            const action_type = document.createElement('td');
            const notes = document.createElement('td');
            const actionCell = document.createElement('td');

            const buttonWrapper = document.createElement('div');
            const editBtn = document.createElement('button');
            const delBtn = document.createElement('button');

            transaction_date.textContent = `${new Date(transaction.transaction_date).toLocaleString('th-TH', timeOption)} น.`;
            amount.textContent = transaction.amount;
            action_type.textContent = transaction.action_type === 'deposit' ? 'ฝากเงิน' : 'ถอนเงิน';;
            notes.textContent = transaction.note;
            buttonWrapper.className = 'd-flex justify-content-center align-items-center';

            editBtn.textContent = 'แก้ไข';
            editBtn.className = 'btn btn-sm btn-outline-warning me-2';
            editBtn.addEventListener('click', () => {
                editTransactionId.value = transaction.id;
                transactionDateInput.value = toISOTimeString(new Date(transaction.transaction_date));
                amountInput.value = transaction.amount;
                actionInput.value = transaction.action_type;
                noteInput.textContent = transaction.note;

                amountInput.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                amountInput.focus();
            });

            delBtn.textContent = 'ลบ';
            delBtn.className = 'btn btn-sm btn-outline-danger';
            delBtn.addEventListener('click', async () => {
                if(confirm(`คุณต้องการลบข้อมูลวันที่ ${new Date(transaction.transaction_date).toLocaleString('th-TH', timeOption)} น. จำนวนเงิน ${transaction.amount} หรือไม่`)){
                    try{
                        const response = await axios.delete(`${API_URL}/${transaction.id}`);
                        await fetchTransaction();
                    }catch(error){
                        if(error.response){
                            console.log(error.response.data.message);
                        }
                        console.log('เกิดข้อผิดพลาดตอนลบข้อมูล: ', error.message);
                    }
                }
            });

            buttonWrapper.append(editBtn, delBtn);
            actionCell.append(buttonWrapper);
            tableRow.append(transaction_date, amount, action_type, notes, actionCell);
            tableBody.append(tableRow);

            currentBalance += transaction.action_type === 'deposit' ? transaction.amount : -transaction.amount;
        });
        updateBalance();
    }catch(error){
        console.log(error.message);
    }
};

const form = document.querySelector('form');
const statusAlert = document.getElementById('status-alert');
form.addEventListener('submit', async (event) => {
    event.preventDefault();
    try{
        const transactionDate = transactionDateInput.value;
        const amount = amountInput.value;
        const action_type = actionInput.value;
        const note = noteInput.value;
        const transactionRow = {
            'transaction_date': transactionDate,
            'amount': amount,
            'action_type': action_type,
            'note': note
        }

        const errors = validateInput(transactionRow);
        if(!errors.isValid){
            const validationError = new Error('กรอกข้อมูลไม่ครบหรือไม่ถูกต้อง โปรดตรวจสอบอีกครั้ง');
            validationError.customErrors = errors.errorMessage;
            throw validationError;
        }

        if(editTransactionId.value === ""){
            const response = await axios.post(`${API_URL}`, transactionRow);
            statusAlert.textContent = 'บันทึกข้อมูลเรียบร้อย';
        }else{
            const response = await axios.put(`${API_URL}/${editTransactionId.value}`, transactionRow)
            statusAlert.textContent = 'แก้ไขข้อมูลเรียบร้อย';
        }
        statusAlert.classList.remove('alert-danger');
        statusAlert.classList.add('d-flex', 'alert', 'alert-success');
        form.reset();
        updateTransactionDateInput();
        updateBalance();
        fetchTransaction();
        editTransactionId.value = '';
    }catch(error){
        if(error.response){
            const statusCode = error.response.data.status;
            error.message = error.response.data.message;
            error.customErrors = error.response.data.errors;
        }else if(error.request){
            error.message = 'ไม่สามารถเชื่อมต่อ Server ได้ กรุณาลองใหม่อีกครั้ง';
        }

        if(error.customErrors && error.customErrors.length > 0){
            const listErrors = error.customErrors.map(errMsg => `<li>${errMsg}</li>`).join('');
            statusAlert.innerHTML = `<div class="mb-1" style="font-size: 1.1rem"><b>${error.message}</b></B></div>`;
            statusAlert.innerHTML += `<ul class="mb-0 ps-3">${listErrors}</ul>`;
        }else{
            statusAlert.innerHTML = error.message || 'การบันทึกข้อมูลเกิดข้อผิดพลาด';
        }
        statusAlert.classList.remove('alert-success');
        statusAlert.classList.add('d-flex', 'flex-column', 'alert', 'alert-danger', 'text-start');
        console.log(error.message);
        console.log(error.customErrors);
    }finally{
        await fetchTransaction();
    }
});

const clearBtn = document.getElementById('clear-btn');
clearBtn.addEventListener('click', (event) => {
    event.preventDefault();
    updateTransactionDateInput();
    editTransactionId.value = '';
    amountInput.value = '';
    noteInput.value = '';
    actionInput.value = 'deposit';

    statusAlert.textContent = '';
    statusAlert.classList.remove('d-flex', 'alert', 'alert-success', 'alert-danger');
});

fetchTransaction();
updateTransactionDateInput();