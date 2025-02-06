import CloseIcon from '@mui/icons-material/Close';

export const Market = ({ setMarket }) => {

    return (
        <div className="marketContainer">
            <CloseIcon className="closeBtn" onClick={() => setMarket(false)} />
            <h3>Market</h3>
            <p>Market is not available right now...</p>
        </div>
    )
}