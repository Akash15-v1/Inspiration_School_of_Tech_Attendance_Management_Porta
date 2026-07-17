document.getElementById("forgotForm").addEventListener("submit", function(e){

    e.preventDefault();

    const email = document.getElementById("email").value;

    document.getElementById("message").style.color = "green";

    document.getElementById("message").innerHTML =
    "Password reset link has been sent to " + email;

});