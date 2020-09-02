const { Octokit } = require("@octokit/rest")

require('dotenv').config()

let TOKEN = process.env.TOKEN
let REPOSITORY = process.env.REPOSITORY

let [owner, repo] = REPOSITORY.split('/')

const ref = 'heads/master';
const FILE = '100644'; // commit mode
const encoding = 'utf-8';
let settings = { method: "Get" };

let octokit = new Octokit({ auth: TOKEN })

module.exports = async (req, res) => {
  let params = req.body
  console.log(params)
  let hash = params['hash']
  let path = `_data/votes/vote_${hash}`
  let count = 2


  try{
    let rawfile = await octokit.repos.getContent({
      owner: owner,
      repo: repo,
      path: path,
      ref: ref
    })
    // console.log(rawfile)

    if (rawfile.status==200){
      let buff = new Buffer.from(rawfile.data.content, 'base64')
      let text = buff.toString('utf-8')
      console.log(text)
      count = parseInt(text)+1
    }
  }catch(error){
    console.log(error)
  }

  let message = `vote: ${hash}-${count}`
  let content = ""+count
  console.log(message)

  await addFileToGit(path, content, message)

  await new Promise(resolve => setTimeout(resolve, 1000))

  res.setHeader('Location', "https://nodebe4.github.io/hero")
  res.status(200).send('已收到，感谢您的赞！')
  
}

/**
 * Create a single-file commit on top of head.
 * Send it a file path like "foo.txt" and a string of file contents.
 */

async function addFileToGit(path, content, message) {

  // 1. Get the sha of the last commit
  const { data: { object } } = await octokit.git.getRef({repo, owner, ref}); //github.ref(repo, ref).object.sha
  const sha_latest_commit = object.sha; // latest commit

  // 2. Find and store the SHA for the tree object that the heads/master commit points to.
  // sha_base_tree = github.commit(repo, sha_latest_commit).commit.tree.sha
  const { data: { tree }} = await octokit.git.getCommit({repo, owner, commit_sha: sha_latest_commit})
  const sha_base_tree = tree.sha; // root of tree for commit

  // 3. Make some content
  const { data: { sha: blob_sha } } = await octokit.git.createBlob({
    repo, owner, encoding, content,
  });

  // 4. Create a new tree with the content in place
  const { data: new_tree } = await octokit.git.createTree({
    repo, owner,
    base_tree: sha_base_tree, // if we don't set this, all other files will show up as deleted.
    tree: [
      {
        path,
        mode: FILE,
        type: 'blob',
        sha: blob_sha,
      }
    ],
  });

  // 5. Create a new commit with this tree object
  const { data: new_commit } = await octokit.git.createCommit({
    repo, owner,
    message,
    tree: new_tree.sha,
    parents: [
      sha_latest_commit
    ],
  });

  // 6. Move the reference heads/master to point to our new commit object.
  const { data: { object: updated_ref } } = await octokit.git.updateRef({
    repo, owner, ref,
    sha: new_commit.sha, 
  });

  console.log({sha_latest_commit, updated_ref: updated_ref.sha});
}
