const Web3 = require("web3");
const jwt = require("jsonwebtoken");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const User = require("../model/Users");

const web3 = new Web3(
  "https://mainnet.infura.io/v3/dc97edeb4fe74911a117127db1662ecd"
);

const Private_Key = process.env.META_MASK_PRIVATE_KEY;
// const from_address = user.walletAddress;

// @desc    Create a Post
// @route   Post /api/v1/activites/post
// @access  Public

exports.sendEthereum = asyncHandler(async (req, res, next) => {
  const token = req.cookies.token;
  const { to_address, value, gas } = req.body;

  try {
    var decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    console.log("Upper");

    let SingedTransaction = await web3.eth.accounts.signTransaction(
      {
        to: to_address,
        value: "1000000000",
        gas: 2000000,
      },
      Private_Key
    );

    console.log("Nichey");

    console.log({ SingedTransaction });

    web3.eth
      .sendSignedTransaction(SignedTransaction.rawTransaction)
      .then((receipt) => {
        console.log("Die Recieptnddsmdlklxmkxslmc", receipt);
      });

    if (!user) {
      return next(new ErrorResponse("No user found", 400));
    }

    res.json({
      success: true,
      message: "Transaction Successfull",
      receipt: receipt,
    });
  } catch (err) {
    console.log({ err });
    return next(new ErrorResponse(err, 400));
  }
});
