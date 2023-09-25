const loginBtn = document.getElementById('loginBtn');
const loginBtn2 = document.getElementById('loginBtn2');
const showTest = document.getElementById('showTest');
const goToLoginBtn = document.getElementById('goToLoginBtn');
const goToSignupBtn = document.getElementById('goToSignupBtn')

loginBtn.addEventListener('click', ()=>{    
    barbarM.style.zIndex = "-9999999";
    barbarM.style.display = "none";
    
    fetch('http://localhost:3351/storeInput', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: document.getElementById('nameInput').value,
            acc: document.getElementById('accInput').value,
            pw: document.getElementById('pwInput').value,
        }),
    })
        .then(res => {
            console.log('Name sent and stored successfully!');
            return;
        })
        .catch(err => {
            console.log('click error');
            return;
        });
})

goToLoginBtn.addEventListener('click', ()=>{
    barbarM2.style.zIndex = "3333333";
    barbarM2.style.display = "flex";
    barbarM.style.zIndex = "-9999999";
    barbarM.style.display = "none";
})

goToSignupBtn.addEventListener('click', ()=>{
    barbarM.style.zIndex = "2222222";
    barbarM.style.display = "flex";
    barbarM2.style.zIndex = "-8999999";
    barbarM2.style.display = "none";
})

loginBtn2.addEventListener('click', ()=>{    
    barbarM2.style.zIndex = "-8999999";
    barbarM2.style.display = "none";
    //name        
    fetch('http://localhost:3351/storeInputEx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            acc2: document.getElementById('accInput2').value,
            pw2: document.getElementById('pwInput2').value,
        }),
    })
        .then(res => {
            console.log('Name sent and stored successfully!');
            return;
        })
        .catch(err => {
            console.log('click error');
            return;
        });

})
