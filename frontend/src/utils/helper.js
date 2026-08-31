export const generateAvatar = (username) => {    
    if(!username) return '';
    return username[0].toUpperCase();
}

export const dateFormat = (date) => {
    const formated = new Date(date).toLocaleString("en-US", {
        dateStyle: "medium",
    })
    
    return formated;
}