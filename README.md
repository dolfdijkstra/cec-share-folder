# cec-share-folder

The program allows you to share folders to users over the REST API.

## instructions

1. npm install  

2. copy .env.in to .env
 
3. change the values in .env to values applicable for your environment
     export CEC_USER='username'
     export CEC_PW='password'
     export CEC_DOMAIN='domain'
     export CEC_URL='https://host.com' 
    
4. ./get-folder-guids.sh > folders

5. create a file 'users' with the usernames of the users you want to share too

6. ./share-folder-to-all.sh --users users --folders folders

## alternative forms
`./share-folder-to-all.sh --users users <guid> <guid>`
  This specifies the folder guids on the command line, instead of reading them from the file
`./share-folder-to-all.sh --users users --role downloader <guid> <guid>`
  This sets another role to a user. The default role is manager.
`./share-folder-to-all.sh --users users --operation unshare -- folders`
  This unshares the folders form the users.