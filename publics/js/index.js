const API_URL = 'http://localhost:8000';

const fetchTransaction = async () => {
    try{
        const tableBody = document.getElementById('table-body');
        const response = await axios.get(`${API_URL}/transaction/`);
        const transactions = response.data;
        console.log(transactions);
        // tableBody.innerHTML = '';
        transactions.forEach((transaction) => {
            const tableRow = document.createElement('tr');
            const transaction_date = document.createElement('td');
            const amount = document.createElement('td');
            const action_type = document.createElement('td');
            const notes = document.createElement('td');

            transaction_date.textContent = `${new Date(transaction.transaction_date).toLocaleString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })} น.`;
            amount.textContent = transaction.amount;
            action_type.textContent = transaction.action_type ? 'ฝากเงิน' : 'ถอนเงิน';;
            notes.textContent = transaction.note;

            console.log(tableRow);

            tableRow.append(transaction_date, amount, action_type, notes);
            tableBody.append(tableRow);
        });
    }catch(error){
        console.log(error.message);
    }
};

fetchTransaction();