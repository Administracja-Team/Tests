import { mount } from '@vue/test-utils';
import Login from '@/views/Login.vue';
import { vi } from 'vitest';
import { useToast } from 'primevue/usetoast';
import { createRouter, createWebHistory } from 'vue-router';
import PrimeVue from 'primevue/config';
import Toast from 'primevue/toast';

vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn().mockReturnValue({
    add: vi.fn(),
  }),
}));

vi.mock('primevue/toast', () => ({
  default: {
    render: () => {},
  },
}));

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: Login }],
});

describe('Login.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(Login, {
      global: {
        plugins: [router, PrimeVue],
      },
    });
  });

  it('проверка рендера формы логина', () => {
    expect(wrapper.find('h1').text()).toBe('Sign in');
    expect(wrapper.find('input[type="text"]').exists()).toBe(true);
    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
    expect(wrapper.find('.login-button').exists()).toBe(true);
    expect(wrapper.find('.register-button').exists()).toBe(true);
  });

  it('валидация: проверка пустых полей', async () => {
    await wrapper.find('.login-button').trigger('click');
    expect(wrapper.vm.errors.email).toBe('Email is required');
    expect(wrapper.vm.errors.password).toBe('Password is required');
  });

  it('проверка успешного входа', async () => {
    const loginUserMock = vi.fn().mockResolvedValue({
      access_token: 'mockAccessToken',
      refresh_token: 'mockRefreshToken',
      expires_at: new Date().toISOString(),
    });
    vi.spyOn(wrapper.vm, 'loginUser').mockImplementation(loginUserMock);

    await wrapper.setData({
      email: 'test@example.com',
      password: 'password123',
    });

    await wrapper.find('.login-button').trigger('click');

    expect(loginUserMock).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('проверка неуспешного входа', async () => {
    const loginUserMock = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
    vi.spyOn(wrapper.vm, 'loginUser').mockImplementation(loginUserMock);

    const showToastMock = vi.fn();
    wrapper.vm.showToast = showToastMock;

    await wrapper.setData({
      email: 'test@example.com',
      password: 'wrongpassword',
    });

    await wrapper.find('.login-button').trigger('click');

    expect(showToastMock).toHaveBeenCalledWith('Invalid credentials', 'error');
  });
});
