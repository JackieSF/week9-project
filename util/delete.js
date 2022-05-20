module.exports = async (id, array, Model, field) => {
    try {
        let i = 0;
        while(i < array.length) {
            let document = await Model.findOne({user: array[i].profile.user});
            let removeIndex = document[field].map(val => val.tweet.toString()).indexOf(id);
            document[field].splice(removeIndex, 1);
            await document.save();
            i++;
        }
    } catch(err) {
        console.log(err.message);
    }
}