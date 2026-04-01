import {useAutoLoginQuery} from '../../features/registrations/LoginSliceApi';

const useIsAuthenticated = () => {
  const {data, error, isLoading, isSuccess} = useAutoLoginQuery(null);
  return {
    data,
    error,
    isLoading,
    isSuccess,
  };
};

export default useIsAuthenticated;
