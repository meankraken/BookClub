$(document).ready(function() {
   $('form').submit(function(e) {
	   $('.alert').remove();
       var user = $("#userBox").val();
       var pass = $("#passBox").val();
       if (user.length>15 || user.length<2) {
           $("#userBox").val("");
           $("<p class='alert' style='color:white'>*Please select a username between 2-15 characters long</p>").insertAfter("#userBox");
           e.preventDefault();
       } 
       else if (pass.length<8) {
           $("#passBox").val("");
           $("<p class='alert'>*Please select a password greater than 8 characters long.</p>").insertAfter("#passBox");
           e.preventDefault();
       } 
       else {
          
       }
       
   }) ;
   
   $('#registerBtn').on('click', function() {
	  window.location = '/register'; 
   });
   
   $('#loginBtn').on('click', function() {
	  window.location = '/login'; 
   });
   
});