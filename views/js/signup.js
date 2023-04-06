const signupForm = document.getElementById('signupform');

signupForm.addEventListener('submit', signup);


async function signup(e) {

    e.preventDefault();

    try {

        const signupDetails = {
            name: e.target.name.value,
            email: e.target.email.value,
            password: e.target.password.value
        }
        console.log(signupDetails)
        const response = await axios.post("http://localhost:3000/user/signup", signupDetails)
        if (response.status === 201) {
            console.log('success');
            window.location.href = '../html/index.html';
        } else {
            e.target.value = '';
            console.log('failure')
        };

    } catch (error) {
        window.alert('Signup Failed!')
        console.log(error);
    };

};

