const mongoose = require('mongoose')

const threadSchema = new mongoose.Schema({
  threadTitle:{
    type:String,
    maxlength: 100,
    required: true
  },
  threadDescription:{
    type:String,
    maxlength: 500,
    required: true
  },
  threadReplyCounter:{
    type:Number
  },
  threadReplies:{
    type: [String],
    maxlength: 50 
  },
  threadLikes:{
    type:Number,
    maxlength: 100000

  },
  threadAuthor:{
    type:String,
    required: true
  }
})

module.exports = mongoose.model("Thread", threadSchema) 