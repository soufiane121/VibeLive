import React, {useState, useEffect} from 'react';
import {useLoginMutation} from '../../features/registrations/LoginSliceApi';

type Props = {
  password: string;
  email: string;
  canFetch: boolean
};

const UsefetchLogin = (props: Props) => {
  const {password, email, canFetch} = props;
  const [fetchData, {data, error, isLoading, isSuccess}] = useLoginMutation();

  useEffect(() => {
    (async () => {
      if (canFetch) {
        console.log('fetch api');
        try {
          const test = await fetchData({password, email}).unwrap();
          console.log({test});
        } catch (error) {
          console.log({error});
        }
      }
    })();
  }, [canFetch]);

  return {
    data,
    error,
    isLoading,
    isSuccess,
  };
};

export default UsefetchLogin;
