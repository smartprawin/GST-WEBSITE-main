function add(a,b){
    return a+b;
}
function sub(a,b){
    return a-b;
}
function time(callback){
    let data=callback(10,20);
    console.log(data)
}
time(add)
time(sub)