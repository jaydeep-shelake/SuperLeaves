async function paginate(Model,PAGE_SIZE,page){
   const total = await Model.countDocuments({})
   const data=await Model.find({})
    .limit(PAGE_SIZE)
    .skip(PAGE_SIZE*page)
   
    return {data,total,totalPages:Math.ceil(total/PAGE_SIZE)}
}
module.exports=paginate