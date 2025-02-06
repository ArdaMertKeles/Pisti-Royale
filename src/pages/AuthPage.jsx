import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import { useState } from 'react';
import { auth, googleProvider } from '../config/firebase'
import { createUserWithEmailAndPassword, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export const AuthPage = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [signUpPage, setSignUpPage] = useState(false)
    const [blankMail, setBlankMail] = useState(false)
    const [blankPassword, setBlankPassword] = useState(false)
    const [invalidAcc, setInvalidAcc] = useState(false)
    const [invalidPass, setInvalidPass] = useState(false)
    const navigate = useNavigate()

    const signUp = async (e) => {
        e.preventDefault()
        if(email !== '' && password !== ''){
            try {
                await createUserWithEmailAndPassword(auth, email, password)
                navigate("/user-info")
            } catch (err) {
                console.error(err)
                if(password.length < 6) {
                    setInvalidPass(true)
                }
            }
        }else {
            if(email === ''){
                setBlankMail(true)
                setTimeout(() => {
                    setBlankMail(false)
                }, 650);
            }
            if(password === ''){
                setBlankPassword(true)
                setTimeout(() => {
                    setBlankPassword(false)
                }, 650);
            }
        }
    }

    const signWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider)
        } catch (err) {
            console.error(err)
        }
    }

    const signIn = async (e) => {
        e.preventDefault()
        if(email !== '' && password !== ''){
            try {
                await signInWithEmailAndPassword(auth, email, password)
                const user = auth.currentUser;
                if(user.displayName){
                    navigate("/main-lobby")
                } else {
                    navigate("/user-info")
                }
            } catch (err) {
                setInvalidAcc(true)
            }
        } else {
            if(email === ''){
                setBlankMail(true)
                setTimeout(() => {
                    setBlankMail(false)
                }, 650);
            }
            if(password === ''){
                setBlankPassword(true)
                setTimeout(() => {
                    setBlankPassword(false)
                }, 650);
            }
        }
    }

    return (
        <div className="authWrapper">
            <h1>Pisti Royale</h1>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            {!signUpPage && <form className="logInContainer">
                <div className='inputs'>
                    <div className={!blankMail ? 'inputDiv' : 'blank'}>
                        <label htmlFor="email">
                            <EmailIcon />
                        </label>
                        <input type="email" id="email" placeholder='Email' onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className={!blankPassword ? 'inputDiv' : 'blank'}>
                        <label htmlFor="password">
                            <LockIcon />
                        </label>
                        <input type="password" id="password" placeholder='Password' onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    {invalidAcc && <p className="invalid">Incorrect password or email</p>}
                </div>
                <div className='targetRefs'>
                    <button className='logInBtn' type='submit' onClick={(e) => signIn(e)}>Sign In</button>
                    <div className='orHr'>
                        <div>
                            <hr />
                        </div>
                        <p>or</p>
                        <div>
                            <hr />
                        </div>
                    </div>
                    <button className='signUpBtn' onClick={() => { setSignUpPage(true); setPassword(''); setEmail(''); setInvalidAcc(false) }}>Sign Up</button>
                    <button type="button" className="login-with-google-btn" onClick={signWithGoogle} >Sign in with Google</button>
                </div>
            </form>}
            {signUpPage && <form className="signUpContainer">
                <div className='inputs'>
                    <div className={!blankMail ? 'inputDiv' : 'blank'}>
                        <label htmlFor="email">
                            <EmailIcon />
                        </label>
                        <input type="email" id="email" placeholder='Email' onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className={!blankPassword ? 'inputDiv' : 'blank'}>
                        <label htmlFor="password">
                            <LockIcon />
                        </label>
                        <input type="password" id="password" placeholder='Password' onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    {invalidPass && <p className="invalid">Password must be at least 6 characters</p>}
                </div>
                <div className='targetRefs'>
                    <button className='logInBtn' type='submit' onClick={(e) => signUp(e)}>Sign Up</button>
                    <div className='orHr'>
                        <div>
                            <hr />
                        </div>
                        <p>or</p>
                        <div>
                            <hr />
                        </div>
                    </div>
                    <button className='signUpBtn' onClick={() => { setSignUpPage(false); setPassword(''); setEmail(''); setInvalidPass(false) }}>Sign In</button>
                </div>
            </form>}
        </div>
    )
}