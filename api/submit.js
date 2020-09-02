if (process.env.DEBUG) {
   require('dotenv').config();
}
const { Octokit } = require("@octokit/rest")

let TOKEN = process.env.TOKEN
let REPOSITORY = process.env.REPOSITORY

let [owner, repo] = REPOSITORY.split('/')

module.exports = async (req, res) => {
  let params = req.body
  console.log(params)
  let name = params['name']
  let keyword = params['keyword']
  let message = params['message']
  let url = process_url(params['url'])
  if (url==null){
    res.status(402).send('illegal url')
  }
  let body = `${url}

---留言---
${message}

  `

  let title = `add_request: ${name}-${keyword}`

  let octokit = new Octokit({ auth: TOKEN })
  let response = await octokit.issues.create({
    owner,
    repo,
    title: title,
    body: body
  })

  await new Promise(resolve => setTimeout(resolve, 1000))

  res.setHeader('Location', response.data.html_url)
  res.status(302).send('')
}

// 'https://zh.wikipedia.org/wiki/%E6%9D%8E%E6%96%87%E4%BA%AE#%E8%A9%95%E5%83%B9%E5%8F%8A%E7%9B%B8%E5%85%B3%E5%8F%8D%E5%BA%94'
// 'https://en.wikipedia.org/wiki/Cai_Xia'

function process_url(url){
  let parts = url.split("://")
  let urlbody = parts[1].split('/')
  urlbody[0] = urlbody[0].toLowerCase() 
  if (urlbody[0] == 'zh.wikipedia.org'){
    urlbody[1] = 'wiki'
    newurl = urlbody.join('/')
    newurl = newurl.split("#")[0]
  }else if (urlbody[0] == 'en.wikipedia.org'){
    urlbody[1] = 'wiki'
    newurl = urlbody.join('/')
    newurl = newurl.split("#")[0]
  }else{
    return null
  }
  parts[0] = "https"
  parts[1] = newurl
  fullurl = parts.join("://")
  console.log(fullurl)
  return fullurl
}

