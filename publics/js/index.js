const API_URL = 'http://localhost:8000';

const timeOption = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
}

const getCurrentDate = () => {
    const date = new Date();
    const now = {
        'day': String(date.getDate()).padStart(2, '0'),
        'month': String(date.getMonth() + 1).padStart(2, '0'),
        'year': String(date.getFullYear() + 543),
        'hour': String(date.getHours()).padStart(2, '0'),
        'minute': String(date.getMinutes()).padStart(2, '0')
    }
    return `${now.year}-${now.month}-${now.day}T${now.hour}:${now.minute}`
}

const transactionDateInput = document.getElementById('transaction-date-input');
const amountInput = document.getElementById('amount-input');
const noteInput = document.getElementById('note-input');
const actionInput = document.getElementById('action-input');
transactionDateInput.value = getCurrentDate();

const clearBtn = document.getElementById('clear-btn');
clearBtn.addEventListener('click', (event) => {
    transactionDateInput.value = getCurrentDate();
    amountInput.value = '';
    noteInput.value = '';
    actionInput.value = 'deposit';
});

const fetchTransaction = async () => {
    try{
        const tableBody = document.getElementById('table-body');
        const response = await axios.get(`${API_URL}/transaction/`);
        const transactions = response.data;
        // tableBody.innerHTML = '';
        transactions.forEach((transaction) => {
            const tableRow = document.createElement('tr');
            const transaction_date = document.createElement('td');
            const amount = document.createElement('td');
            const action_type = document.createElement('td');
            const notes = document.createElement('td');

            transaction_date.textContent = `${new Date(transaction.transaction_date).toLocaleString('th-TH', timeOption)} น.`;
            amount.textContent = transaction.amount;
            action_type.textContent = transaction.action_type ? 'ฝากเงิน' : 'ถอนเงิน';;
            notes.textContent = transaction.note;

            tableRow.append(transaction_date, amount, action_type, notes);
            tableBody.append(tableRow);
        });
    }catch(error){
        console.log(error.message);
    }
};

fetchTransaction();