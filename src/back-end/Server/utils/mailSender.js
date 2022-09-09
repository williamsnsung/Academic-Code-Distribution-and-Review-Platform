//https://www.geeksforgeeks.org/how-to-send-email-using-node-js/
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    service: 'smtp.gmail.com',
    auth: {
      user: 'sgcteam3@gmail.com',
      pass: 'Team3!!!'
    }
  });
export const mailConfigurations = {
    from: 'sgcteam3@gmail.com',
    to: 'Sender',
    subject: 'mail subject',
    text: 'mail content'
    };
export function sendResetMail(subject,text, email){
  
  mailConfigurations.to = email;
  mailConfigurations.subject = subject;
  mailConfigurations.text = text;
  console.log("called");
  transporter.sendMail(mailConfigurations, function(error, info){
      if (error){
        console.log(error);
        return -1;
      }else{
        console.log('Email Sent Successfully');
        console.log(info);
        return 1;
      }
      
  });
}  


                    //npm install nodemailer