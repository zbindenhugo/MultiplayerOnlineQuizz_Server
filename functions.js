export default function(){
    function generateRandomPassword(){
        return Math.random().toString(36).slice(-6)
    }
}



