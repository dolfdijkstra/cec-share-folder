const request = require('request-promise-native');
const async = require('async');
const base = process.env.CEC_URL,
    user = process.env.CEC_USER,
    password = process.env.CEC_PW;
var argv = require('minimist')(process.argv.slice(2));

const folders = argv._;
const role = argv.role ? argv.role : "manager";
if (folders.length == 0) {
    console.error('Please provide a folder GUID as the first argument.');
    process.exit(1);
}


let auth = {
    'user': user,
    'pass': password,
    'sendImmediately': true
};


const getUser = (name) => {
    let options = {
        method: 'GET',
        auth: auth,
        json: true,
        uri: base + '/documents/api/1.1/users/items',
        qs: {
            info: name
        }
    };
    /*items: 
   [ { type: 'user',
       id: 'UAAC3A1C57FCBC431624F655D4018AFDB5A0',
       displayName: 'Demo User1',
       loginName: 'demouser1' },
       */
    return request(options).then(body => body.items.filter(e => e.type === 'user' && e.loginName === name));
};

const share = (folder, user) => {
    let options = {
        method: 'POST',
        auth: auth,
        json: true,
        uri: base + '/documents/api/1.1/shares/' + folder,
        body: {
            "userID": user,
            "role": role,
            "message": "Granting you access to this folder as a " + role
        }
    };
    return request(options);
};

const shareAll = (guids) => {
    async.eachSeries(guids, (guid, cb) => Promise.all(folders.map(folder => share(folder, guid))).then(() => cb()).catch(err => cb(err)), (err) => {
        if (err) {
            console.error(err);
        } else {
            console.log('done');
        }
    });

};
let p = [];
for (let i = 61; i <= 100; i++) {
    p.push(getUser('demouser' + i).then(users => users.length > 0 ? users[0].id : ''));
}

Promise.all(p).then(guids => {
    console.log(guids.length);
    console.log(guids);
    shareAll(guids);
});
